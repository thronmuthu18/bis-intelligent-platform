import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, BookOpen, FileSearch } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProduct } from '@/contexts/ProductContext';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductAssistantPage — AI Intelligence Assistant Workspace (Section 19 Empty State)
// ─────────────────────────────────────────────────────────────────────────────

export function ProductAssistantPage(): React.ReactElement {
  const { product } = useProduct();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="pb-3 border-b border-surface-border">
        <h2 className="text-lg font-bold text-text-primary">AI Compliance Assistant</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Intelligent standards retrieval, compliance query assistant, and dossier generation for {product?.name || 'this product'}.
        </p>
      </div>

      {/* ── Main AI Assistant Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardBody>
              <EmptyState
                icon={Bot}
                title="The AI assistant will be available after the product information workflow is connected."
                description="In upcoming phases, the AI intelligence engine will leverage official BIS gazettes, standard specifications, and laboratory records to answer your product-specific compliance questions."
                actionLabel="Review Product Overview"
                onAction={() => product && navigate(`/products/${product.id}`)}
              />
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Upcoming AI Capabilities */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planned AI Capabilities</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-xs text-text-secondary">
              <div className="flex items-start gap-2.5">
                <BookOpen size={16} className="text-accent-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">IS Standard Matching</p>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Semantic search across Indian Standards catalog.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileSearch size={16} className="text-accent-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Clause Verification</p>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Extract mandatory testing clauses from official gazette notifications.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-accent-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">RAG-Powered Q&A</p>
                  <p className="text-text-muted text-[11px] mt-0.5">
                    Accurate citations with direct links to official BIS source documents.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
