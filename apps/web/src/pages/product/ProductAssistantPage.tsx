import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Sparkles,
  BookOpen,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

import { useProduct } from '@/contexts/ProductContext';
import { assistantService } from '@/services/api';
import type {
  AssistantConversation,
  AssistantMessage,
  AssistantCitation,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Quick Compliance Prompts
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'What BIS standards may apply to my product?',
  'Is my product affected by a mandatory QCO?',
  'What testing requirements should I check?',
  'What documents are currently missing?',
  'What certification scheme may apply?',
];

export function ProductAssistantPage(): React.ReactElement {
  const { product, isLoading: isProductLoading } = useProduct();

  // Conversations State
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<AssistantConversation | null>(null);

  // Messages State
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // Loading / UI States
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Citations / Evidence Drawer State
  const [selectedCitation, setSelectedCitation] = useState<AssistantCitation | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState<boolean>(false);
  const [activeEvidenceMessage, setActiveEvidenceMessage] = useState<AssistantMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Scroll to bottom of message stream
  // ─────────────────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);


  // ─────────────────────────────────────────────────────────────────────────────
  //  Fetch conversations list
  // ─────────────────────────────────────────────────────────────────────────────
  const loadConversations = useCallback(
    async (selectLatest = false) => {
      if (!product?.id) return;
      try {
        setIsLoadingConversations(true);
        setErrorMessage(null);
        const data = await assistantService.getConversations(product.id);
        setConversations(data);

        if (data.length > 0) {
          if (selectLatest || !activeConversationId) {
            setActiveConversationId(data[0].id);
          }
        } else {
          setActiveConversationId(null);
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 401 || status === 403) {
          setErrorMessage('Your access to this product has expired or is unavailable.');
        } else if (err?.message && !err.message.includes('Internal server error')) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Assistant is temporarily unavailable. Please try again.');
        }
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [product?.id, activeConversationId]
  );


  useEffect(() => {
    loadConversations();
  }, [product?.id]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Load selected conversation details & messages
  // ─────────────────────────────────────────────────────────────────────────────
  const loadActiveConversation = useCallback(async () => {
    if (!product?.id || !activeConversationId) return;
    try {
      setIsLoadingMessages(true);
      setErrorMessage(null);
      const data = await assistantService.getConversation(product.id, activeConversationId);
      setActiveConversation(data);
      setMessages(data.messages || []);
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401 || status === 403) {
        setErrorMessage('Your access to this product has expired or is unavailable.');
      } else {
        setErrorMessage(err?.message || 'Failed to load conversation history.');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [product?.id, activeConversationId, scrollToBottom]);

  useEffect(() => {
    if (activeConversationId) {
      loadActiveConversation();
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─────────────────────────────────────────────────────────────────────────────
  //  Create New Conversation
  // ─────────────────────────────────────────────────────────────────────────────
  const handleCreateNewConversation = async (initialQuery?: string) => {
    if (!product?.id || isSending) return;
    try {
      setIsSending(true);
      setErrorMessage(null);
      const newConv = await assistantService.createConversation(product.id, {
        title: initialQuery ? (initialQuery.slice(0, 45) + (initialQuery.length > 45 ? '...' : '')) : 'New Compliance Query',
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveConversation(newConv);
      setMessages([]);

      if (initialQuery) {
        // Automatically dispatch initial query in the newly created conversation
        await handleSendMessageToConversation(newConv.id, initialQuery);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not create new conversation.');
    } finally {
      setIsSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Send Message Helper
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSendMessageToConversation = async (conversationId: string, content: string) => {
    if (!product?.id || !content.trim()) return;

    // Optimistic user message insertion
    const tempUserMsg: AssistantMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'USER',
      content: content.trim(),
      grounded: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');

    try {
      setIsSending(true);
      setErrorMessage(null);

      const res = await assistantService.sendMessage(product.id, conversationId, {
        content: content.trim(),
        includeProductContext: true,
      });

      // Append real assistant response with citations
      setMessages((prev) => {
        // Filter out temp message if server returned it or just append assistant message
        return [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, res.message];
      });

      // Update conversation title if needed in sidebar list
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
      );
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401 || status === 403) {
        setErrorMessage('Your access to this product has expired or is unavailable.');
      } else {
        setErrorMessage(err?.message || 'Assistant is temporarily unavailable. Please try again.');
      }
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Form / Keyboard Input Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    const query = inputText.trim();

    if (!activeConversationId) {
      await handleCreateNewConversation(query);
    } else {
      await handleSendMessageToConversation(activeConversationId, query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const openEvidenceDrawer = (message: AssistantMessage) => {
    setActiveEvidenceMessage(message);
    setIsEvidenceDrawerOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  Render Guards
  // ─────────────────────────────────────────────────────────────────────────────
  if (isProductLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-surface-muted/60 animate-pulse rounded-xl" />
        <div className="h-96 bg-surface-muted/40 animate-pulse rounded-2xl border border-surface-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Page Header & Scoped Product Context ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">AI Compliance Assistant</h1>
            <Badge variant="blue" dot>
              Grounded Intelligence
            </Badge>
            {product?.name && (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-surface-muted text-text-secondary border border-surface-border font-medium">
                Product: <strong className="text-text-primary">{product.name}</strong>
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Product-scoped BIS compliance intelligence grounded with verified Indian Standards, Gazette QCOs, testing scopes, and lab records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadConversations()}
            disabled={isLoadingConversations}
            className="flex items-center gap-1.5"
            aria-label="Refresh conversations"
          >
            <RotateCw size={13} className={isLoadingConversations ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCreateNewConversation()}
            disabled={isSending}
            className="flex items-center gap-1.5"
            aria-label="New Conversation"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => {
              if (activeConversationId) loadActiveConversation();
              else loadConversations();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Main Workspace Grid: Sidebar + Chat Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* ── Left Column: Conversations Sidebar ── */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-surface-border bg-surface-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <MessageSquare size={13} className="text-accent-600" />
                <span>Conversations</span>
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                {conversations.length}
              </span>
            </div>

            <div className="p-2 max-h-[500px] overflow-y-auto space-y-1.5">
              {isLoadingConversations ? (
                <div className="space-y-2 p-2">
                  <div className="h-8 bg-surface-muted animate-pulse rounded-lg" />
                  <div className="h-8 bg-surface-muted animate-pulse rounded-lg" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  <p className="font-medium text-text-secondary">No conversations yet</p>
                  <p className="text-[11px] mt-1">Start a conversation about this product's BIS compliance.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-accent-50 text-accent-900 font-semibold border border-accent-200'
                          : 'text-text-secondary hover:bg-surface-muted border border-transparent'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <p className="truncate text-xs">{conv.title || 'Compliance Query'}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {isActive && <ChevronRight size={13} className="text-accent-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Product Profile Card Info */}
          <Card className="p-3 bg-surface-muted/20 border-surface-border">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Verification Scope</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Queries evaluate BIS Scheme I (ISI Mark), Scheme II (CRS), QCO mandate gazettes, and lab directory schedules.
              </p>
            </div>
          </Card>
        </div>

        {/* ── Right Column: Chat History & Message Console ── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="flex flex-col h-[650px] border-surface-border shadow-2xs">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-surface-border bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-50 text-accent-700 flex items-center justify-center border border-accent-200">
                  <Bot size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-text-primary">
                    {activeConversation?.title || (product ? `${product.name} Assistant` : 'Product AI Assistant')}
                  </h2>
                  <p className="text-[10px] text-text-muted">
                    {product?.category ? `Category: ${product.category}` : 'Grounded Compliance Analysis'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  RAG Active
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div
              tabIndex={0}
              role="region"
              aria-label="Conversation message stream"
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-page/50 focus:outline-hidden"
            >
              {isLoadingMessages ? (
                <div className="space-y-3 py-6">
                  <div className="h-16 bg-surface-muted/60 animate-pulse rounded-xl w-3/4" />
                  <div className="h-20 bg-surface-muted/40 animate-pulse rounded-xl w-3/4 ml-auto" />
                  <div className="h-24 bg-surface-muted/60 animate-pulse rounded-xl w-3/4" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center">
                  <EmptyState
                    icon={Sparkles}
                    title="Start a conversation about this product's BIS compliance."
                    description="Ask a question about standards, testing, certification, or documents to retrieve verified compliance intelligence."
                  />

                  {/* Quick Prompts */}
                  <div className="max-w-xl mx-auto mt-6 space-y-2 text-left">
                    <p className="text-xs font-semibold text-text-secondary px-1">
                      Suggested Compliance Inquiries:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!activeConversationId) {
                              handleCreateNewConversation(prompt);
                            } else {
                              handleSendMessageToConversation(activeConversationId, prompt);
                            }
                          }}
                          disabled={isSending}
                          className="p-2.5 rounded-lg bg-white border border-surface-border text-text-primary text-xs hover:border-accent-400 hover:bg-accent-50/40 text-left transition-all flex items-start gap-2 shadow-2xs group"
                        >
                          <ChevronRight size={13} className="text-accent-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                          <span className="line-clamp-2">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'USER';
                  const citations = msg.citations || [];

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center shrink-0 mt-1 border border-accent-200">
                          <Bot size={16} />
                        </div>
                      )}

                      <div className={`max-w-[82%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isUser
                              ? 'bg-accent-600 text-white rounded-tr-xs'
                              : 'bg-white text-text-primary border border-surface-border rounded-tl-xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          {/* Citation Badges in Assistant Message */}
                          {!isUser && citations.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                                Citations:
                              </span>
                              {citations.map((cite, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => {
                                    setSelectedCitation(cite);
                                    openEvidenceDrawer(msg);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium transition-colors cursor-pointer"
                                  title={cite.sourceTitle}
                                >
                                  <BookOpen size={10} />
                                  <span>
                                    [{cite.citationIndex || cIdx + 1}]{' '}
                                    {cite.isNumber || cite.sourceTitle.slice(0, 16)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Zero-Evidence State Notice */}
                          {!isUser && citations.length === 0 && (
                            <div className="mt-2.5 pt-2 border-t border-surface-border/40 text-[11px] text-text-muted italic flex items-center gap-1">
                              <Info size={11} />
                              <span>The assistant response did not return verified source evidence.</span>
                            </div>
                          )}
                        </div>

                        {/* Message Metadata & Actions */}
                        <div
                          className={`flex items-center gap-2 text-[10px] text-text-muted px-1 ${
                            isUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!isUser && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="hover:text-text-primary flex items-center gap-1 transition-colors"
                                aria-label="Copy message"
                              >
                                {copiedMessageId === msg.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-600" />
                                    <span className="text-emerald-600">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {citations.length > 0 && (
                                <>
                                  <span>•</span>
                                  <button
                                    onClick={() => openEvidenceDrawer(msg)}
                                    className="hover:text-accent-600 font-medium flex items-center gap-1 text-accent-700"
                                  >
                                    <Layers size={11} />
                                    <span>View Evidence ({citations.length})</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Sending / Processing indicator */}
              {isSending && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center shrink-0 border border-accent-200">
                    <Bot size={16} />
                  </div>
                  <div className="p-3 bg-white rounded-2xl rounded-tl-xs border border-surface-border text-xs text-text-secondary flex items-center gap-2 shadow-2xs">
                    <RotateCw size={13} className="animate-spin text-accent-600" />
                    <span>Grounding response with authoritative BIS repositories...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Console */}
            <div className="p-3 border-t border-surface-border bg-white rounded-b-xl space-y-2">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isSending
                      ? 'Analyzing BIS requirements...'
                      : 'Ask about IS standards, QCO mandates, lab testing, or certification schemes (Enter to send, Shift+Enter for newline)...'
                  }
                  disabled={isSending}
                  rows={2}
                  className="w-full text-xs p-3 pr-14 rounded-xl border border-surface-border bg-surface-page focus:outline-hidden focus:ring-1 focus:ring-accent-500 resize-none placeholder:text-text-muted disabled:opacity-60"
                  aria-label="Assistant query input"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="absolute right-2.5 bottom-3.5 h-8 px-3 rounded-lg"
                  aria-label="Send message"
                >
                  <Send size={13} />
                </Button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
                <span>Authoritative Grounding Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Citations & Source Evidence Modal / Drawer ── */}
      <Modal
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        title="Authoritative Source Evidence"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Verified evidence retrieved directly from official BIS repositories, gazette notifications, and laboratory schedules for this compliance assessment.
          </p>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {activeEvidenceMessage?.citations && activeEvidenceMessage.citations.length > 0 ? (
              activeEvidenceMessage.citations.map((cite, idx) => {
                const isHighlighted = selectedCitation?.sourceTitle === cite.sourceTitle;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                      isHighlighted
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-surface-card border-surface-border hover:border-surface-divider'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                          {cite.citationIndex || idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-text-primary text-xs">{cite.sourceTitle}</p>
                          {cite.isNumber && (
                            <span className="text-[10px] font-mono bg-surface-muted px-1.5 py-0.2 rounded text-text-secondary">
                              Standard: {cite.isNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="blue">{cite.authorityLevel || 'AUTHORITATIVE'}</Badge>
                    </div>

                    {cite.clauseOrSection && (
                      <div className="p-2 bg-white rounded-lg border border-surface-border text-[11px] space-y-1">
                        <span className="font-semibold text-text-secondary text-[10px] uppercase">
                          Referenced Section / Clause:
                        </span>
                        <p className="text-text-primary font-mono">{cite.clauseOrSection}</p>
                      </div>
                    )}

                    {cite.sourceUrl && (
                      <div className="pt-1">
                        <a
                          href={cite.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-accent-600 hover:underline text-[11px] font-medium"
                        >
                          <span>View Official Reference Document</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-text-muted">
                No source evidence returned for this response.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-surface-border">
            <Button variant="secondary" size="sm" onClick={() => setIsEvidenceDrawerOpen(false)}>
              Close Evidence
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
