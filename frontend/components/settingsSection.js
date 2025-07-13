"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="mb-6">
      <CardHeader onClick={() => setIsOpen(!isOpen)} className="cursor-pointer flex justify-between items-center">
        <CardTitle>{title}</CardTitle>
        <span className="text-2xl">{isOpen ? "-" : "+"}</span>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}
