'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CandidateSafetyTips = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50  w-full to-green-100  text-green-950 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-2xl">
      <Link href="/">
        <div className="flex items-center text-green-500 hover:text-green-300 mb-6 transition">
          <ArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </div>
      </Link>

      <h1 className="text-4xl font-bold text-center text-green-500 mb-8">
        Safety Tips for Candidates
      </h1>

      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="item-1">
          <AccordionTrigger> Research recruiters and companies</AccordionTrigger>
          <AccordionContent>
            Verify that the recruiter and company are legitimate before sharing any personal information or attending interviews.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Never pay for job opportunities</AccordionTrigger>
          <AccordionContent>
            Legitimate companies will never ask you to pay for a job interview, training, or onboarding.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Use official communication channels</AccordionTrigger>
          <AccordionContent>
            Keep communication on official emails or trusted platforms to avoid phishing or scams.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger> Protect your personal data</AccordionTrigger>
          <AccordionContent>
            Share sensitive documents like IDs or account details only when it's absolutely necessary and through secure methods.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
);

export default CandidateSafetyTips;
