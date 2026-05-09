import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';

const MarketingFAQ = ({ faqs }) => {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              'overflow-hidden rounded-xl border border-border bg-card transition-colors',
              isOpen && 'border-primary/40 shadow-sm'
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-base">{faq.question || faq.q}</span>
              <span
                className={cn(
                  'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180 text-primary'
                )}
              >
                {Icons.chevronDown}
              </span>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer || faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketingFAQ;
