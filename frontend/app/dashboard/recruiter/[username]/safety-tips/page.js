'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RecruiterSafetyTips = () => (
  <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-2xl">
      <Link href="/">
        <div className="flex items-center text-green-500 hover:text-green-800 mb-6 transition">
          <ArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </div>
      </Link>

      <h1 className="text-4xl font-bold text-center text-green-500 mb-8">
        Safety Tips for Recruiters
      </h1>

      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="item-1">
          <AccordionTrigger>Verify candidate credentials and references</AccordionTrigger>
          <AccordionContent>
            Always confirm academic records, experience, and references before moving forward with interviews or offers.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Avoid requesting sensitive documents insecurely</AccordionTrigger>
          <AccordionContent>
            Do not request passports, bank information, or similar sensitive details through email or unverified platforms.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Use trusted platforms for communication</AccordionTrigger>
          <AccordionContent>
            Ensure all hiring conversations happen within verified channels like official company emails or platforms with end-to-end encryption.
          </AccordionContent>
        </AccordionItem>

        {/* <AccordionItem value="item-4">
          <AccordionTrigger>Report suspicious activity immediately</AccordionTrigger>
          <AccordionContent>
            If you encounter fraudulent profiles or malicious activity, report them through the platform or appropriate authorities.
          </AccordionContent>
        </AccordionItem> */}
      </Accordion>
    </div>
  </div>
);

export default RecruiterSafetyTips;
