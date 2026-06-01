import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const MarketingFAQ = ({ faqs }) => (
  <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
    {faqs.map((faq, i) => (
      <AccordionItem
        key={i}
        value={`faq-${i}`}
        className="overflow-hidden rounded-xl border border-border bg-card px-5 data-[state=open]:border-primary/40 data-[state=open]:shadow-sm"
      >
        <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
          {faq.question || faq.q}
        </AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5 pt-0">
          {faq.answer || faq.a}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export default MarketingFAQ;
