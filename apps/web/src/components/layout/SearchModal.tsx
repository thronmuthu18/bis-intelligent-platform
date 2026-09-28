import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, BookOpen, FileText, Package, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DEMO_PRODUCTS } from '@/mocks/mockProducts';

// ─────────────────────────────────────────────────────────────────────────────
//  SearchModal Component — Global Command/Search Palette (Phase 1 UI)
// ─────────────────────────────────────────────────────────────────────────────

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Reset query on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredProducts = query.trim()
    ? DEMO_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleSelectProduct = (productId: string) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  const handleQuickNav = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="-mt-2">
        {/* Search input field */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-surface-border">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search products, documents, standards, or services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary p-1 rounded"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-text-muted bg-surface-muted rounded border border-surface-border">
            ESC
          </kbd>
        </div>

        {/* Search results & quick shortcuts */}
        <div className="py-3 max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-3 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Quick Navigation
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleQuickNav('/products')}
                    className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-surface-muted transition-colors"
                  >
                    <Package size={15} className="text-accent-500" />
                    <span>My Products</span>
                  </button>
                  <button
                    onClick={() => handleQuickNav('/products/new')}
                    className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-surface-muted transition-colors"
                  >
                    <Sparkles size={15} className="text-accent-500" />
                    <span>Create New Product</span>
                  </button>
                  <button
                    onClick={() => handleQuickNav('/consumer')}
                    className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-surface-muted transition-colors"
                  >
                    <BookOpen size={15} className="text-accent-500" />
                    <span>Consumer Services</span>
                  </button>
                  <button
                    onClick={() => handleQuickNav('/hallmarking')}
                    className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium text-text-primary hover:bg-surface-muted transition-colors"
                  >
                    <FileText size={15} className="text-accent-500" />
                    <span>Hallmarking Services</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Recent Demo Products
                </p>
                <div className="space-y-1">
                  {DEMO_PRODUCTS.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-surface-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package size={14} className="text-text-muted group-hover:text-accent-500" />
                        <div>
                          <p className="text-xs font-medium text-text-primary">{prod.name}</p>
                          <p className="text-[11px] text-text-muted">{prod.category}</p>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="px-3">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                Products Matching &quot;{query}&quot;
              </p>
              <div className="space-y-1">
                {filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-surface-muted transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package size={15} className="text-accent-500" />
                      <div>
                        <p className="text-xs font-medium text-text-primary">{prod.name}</p>
                        <p className="text-[11px] text-text-secondary">{prod.description}</p>
                      </div>
                    </div>
                    <Badge variant="blue">{prod.category}</Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-text-primary">No results found</p>
              <p className="text-xs text-text-muted mt-1">
                No matching products or records for &quot;{query}&quot; in the workspace.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-surface-muted/60 border-t border-surface-border rounded-b-xl flex items-center justify-between text-[11px] text-text-muted">
          <span>Global Search UI (Phase 1 Demonstration)</span>
          <span>Use ⭡ ⭣ to navigate</span>
        </div>
      </div>
    </Modal>
  );
}
