"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Upload, Loader2, CheckCircle2, AlertCircle, Database, Globe, FileSpreadsheet, FormInput, Server } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFormData } from "@/lib/api/upload";

/* ---------- Constants ---------- */

const COUNTRIES = [
  { group: "North Africa", items: [
    { iso: "DZ", name: "Algeria" }, { iso: "EG", name: "Egypt" }, { iso: "LY", name: "Libya" },
    { iso: "MA", name: "Morocco" }, { iso: "TN", name: "Tunisia" },
  ]},
  { group: "West Africa", items: [
    { iso: "BJ", name: "Benin" }, { iso: "CI", name: "Cote d'Ivoire" }, { iso: "GH", name: "Ghana" },
    { iso: "NG", name: "Nigeria" }, { iso: "SN", name: "Senegal" },
  ]},
  { group: "East Africa", items: [
    { iso: "ET", name: "Ethiopia" }, { iso: "KE", name: "Kenya" }, { iso: "RW", name: "Rwanda" },
    { iso: "TZ", name: "Tanzania" }, { iso: "UG", name: "Uganda" },
  ]},
  { group: "Central Africa", items: [
    { iso: "CM", name: "Cameroon" }, { iso: "CD", name: "DR Congo" }, { iso: "GA", name: "Gabon" },
    { iso: "CG", name: "Congo" }, { iso: "TD", name: "Chad" },
  ]},
  { group: "Southern Africa", items: [
    { iso: "AO", name: "Angola" }, { iso: "BW", name: "Botswana" }, { iso: "MZ", name: "Mozambique" },
    { iso: "ZA", name: "South Africa" }, { iso: "ZM", name: "Zambia" },
  ]},
];

const INDICATORS = [
  { group: "Economic", items: [
    { code: "NY.GDP.PCAP.CD", name: "GDP per capita (USD)" },
    { code: "NV.IND.MANF.ZS", name: "Manufacturing (% of GDP)" },
    { code: "BX.KLT.DINV.WD.GD.ZS", name: "FDI (% of GDP)" },
  ]},
  { group: "Health", items: [
    { code: "SP.DYN.LE00.IN", name: "Life expectancy (years)" },
    { code: "SH.STA.MMRT", name: "Maternal mortality (per 100k)" },
    { code: "SH.DYN.MORT", name: "Under-5 mortality (per 1k)" },
  ]},
  { group: "Education", items: [
    { code: "SE.ADT.LITR.ZS", name: "Adult literacy rate (%)" },
    { code: "SE.PRM.ENRR", name: "Primary enrollment (% gross)" },
    { code: "SE.SEC.ENRR", name: "Secondary enrollment (% gross)" },
  ]},
  { group: "Gender", items: [
    { code: "SG.GEN.PARL.ZS", name: "Women in parliament (%)" },
    { code: "SE.ENR.PRSC.FM.ZS", name: "Gender parity index" },
    { code: "SL.TLF.TOTL.FE.ZS", name: "Female labor force (%)" },
  ]},
  { group: "Youth", items: [
    { code: "SL.UEM.1524.ZS", name: "Youth unemployment (%)" },
  ]},
  { group: "Infrastructure", items: [
    { code: "IT.NET.USER.ZS", name: "Internet users (%)" },
    { code: "EG.ELC.ACCS.ZS", name: "Electricity access (%)" },
    { code: "IT.CEL.SETS.P2", name: "Mobile subscriptions (per 100)" },
  ]},
];

interface EntryRow {
  id: string;
  country_iso: string;
  indicator_code: string;
  year: string;
  value: string;
}

function createEmptyRow(): EntryRow {
  return {
    id: crypto.randomUUID(),
    country_iso: "",
    indicator_code: "",
    year: "2023",
    value: "",
  };
}

export default function DataEntryPage() {
  const [rows, setRows] = useState<EntryRow[]>([createEmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = useCallback((id: string, field: keyof EntryRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);

  const validate = (): string | null => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.country_iso) return `Row ${i + 1}: Please select a country.`;
      if (!row.indicator_code) return `Row ${i + 1}: Please select an indicator.`;
      const year = parseInt(row.year, 10);
      if (isNaN(year) || year < 2000 || year > 2025) return `Row ${i + 1}: Year must be between 2000 and 2025.`;
      const val = parseFloat(row.value);
      if (isNaN(val)) return `Row ${i + 1}: Value must be a valid number.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    setFeedback(null);
    const err = validate();
    if (err) {
      setFeedback({ type: "error", message: err });
      return;
    }

    setSubmitting(true);
    try {
      const entries = rows.map((r) => ({
        country_iso: r.country_iso,
        indicator_code: r.indicator_code,
        year: parseInt(r.year, 10),
        value: parseFloat(r.value),
      }));
      const result = await submitFormData(entries);
      setFeedback({
        type: "success",
        message: `Successfully submitted ${result.records_inserted} record${result.records_inserted !== 1 ? "s" : ""}.`,
      });
      // Reset form
      setRows([createEmptyRow()]);
    } catch {
      setFeedback({
        type: "error",
        message: "Submission failed. The data entry endpoint may not be available yet. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 border-l-4 border-l-au-green bg-au-green/5">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-au-green flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-au-dark">Manual Data Entry</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Submit data from member states, partner reports, and supplementary sources. Each entry will be
              validated, stored, and reflected in continental analytics and insights generation.
            </p>
          </div>
        </div>
      </Card>

      {/* Supported Sources */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Supported sources:</span>
        <Badge variant="outline" className="text-[10px] gap-1 bg-au-green/5 text-au-green border-au-green/30">
          <Globe className="h-3 w-3" /> World Bank API (Automated)
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1 bg-au-gold/5 text-au-gold border-au-gold/30">
          <FileSpreadsheet className="h-3 w-3" /> Excel Upload
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1 bg-severity-neutral/5 text-severity-neutral border-severity-neutral/30">
          <FormInput className="h-3 w-3" /> Manual Entry
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
          <Server className="h-3 w-3" /> DHIS2 Import (Coming Soon)
        </Badge>
      </div>

      {/* Entry Form */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-au-dark mb-4">Data Entries</h3>

        {/* Column Headers (visible on larger screens) */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 mb-2 px-1">
          <div className="col-span-3">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Country</Label>
          </div>
          <div className="col-span-4">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicator</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Year</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</Label>
          </div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 md:p-1 bg-gray-50/50 md:bg-transparent rounded-lg md:rounded-none border md:border-0 border-gray-200"
            >
              {/* Country */}
              <div className="md:col-span-3">
                <Label className="text-xs text-muted-foreground md:hidden mb-1 block">Country</Label>
                <Select value={row.country_iso} onValueChange={(v) => updateRow(row.id, "country_iso", v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((group) => (
                      <SelectGroup key={group.group}>
                        <SelectLabel className="text-[10px] uppercase text-muted-foreground">{group.group}</SelectLabel>
                        {group.items.map((c) => (
                          <SelectItem key={c.iso} value={c.iso} className="text-xs">
                            {c.name} ({c.iso})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Indicator */}
              <div className="md:col-span-4">
                <Label className="text-xs text-muted-foreground md:hidden mb-1 block">Indicator</Label>
                <Select value={row.indicator_code} onValueChange={(v) => updateRow(row.id, "indicator_code", v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDICATORS.map((group) => (
                      <SelectGroup key={group.group}>
                        <SelectLabel className="text-[10px] uppercase text-muted-foreground">{group.group}</SelectLabel>
                        {group.items.map((ind) => (
                          <SelectItem key={ind.code} value={ind.code} className="text-xs">
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground md:hidden mb-1 block">Year</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2025}
                  value={row.year}
                  onChange={(e) => updateRow(row.id, "year", e.target.value)}
                  className="h-9 text-xs"
                  placeholder="2023"
                />
              </div>

              {/* Value */}
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground md:hidden mb-1 block">Value</Label>
                <Input
                  type="number"
                  step="any"
                  value={row.value}
                  onChange={(e) => updateRow(row.id, "value", e.target.value)}
                  className="h-9 text-xs"
                  placeholder="0.00"
                />
              </div>

              {/* Remove */}
              <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  title={`Remove row ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={addRow} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Row
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{rows.length} entr{rows.length === 1 ? "y" : "ies"}</span>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="sm"
              className="bg-au-green hover:bg-au-green/90 text-white text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Submit Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mt-4 flex items-start gap-2 px-3 py-2.5 rounded-md text-xs ${
              feedback.type === "success"
                ? "bg-au-green/10 text-au-green border border-au-green/20"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
