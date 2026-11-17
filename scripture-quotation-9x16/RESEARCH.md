# Claims register: Scripture Quotation explainer

**Source of every claim:** "Scripture Quotation in Generative AI", Jake Carlson, The Apologist Project, Aug 5 2026
(Drive PDF `1xu7Sg9VdnpxiODHOAtdoeXl57y0TIXUo`; public page apologistproject.org/scripture-quotation-in-generative-ai,
which loaded on 2026-11-17 and shows the same 33,000 and 99.4 figures). Page numbers are the PDF's printed page numbers.

The Christianity Today piece (Nov 16) is background only. Not used: any CT quote, the YouVersion 15% and 60% figures,
any product or model name, and the paper's model rankings.

## On-screen figures
| On screen | PDF | Page | Check |
|---|---|---|---|
| 33,000 tests | "33,000 observations" (English run: 5 methods × 10 translations × 10 passages × 10 models × 2.2 × 3) | 2, 23–24 | Arithmetic recomputed: 33,000 ✓ |
| Model alone 32.6% | Unassisted, Exact, English | 2, 29 | ✓ |
| Web search 48.5% | Web Search, Exact, English | 2, 29 | ✓ |
| Handed the passage 93.0% (best case) | Simulated RAG (Ceiling), Exact, English | 2, 29 | ✓ "best case" = paper's "hard ceiling" (p.22) |
| Lookup tool 96.2% | Tool Calls, Exact, English | 2, 29 | ✓ |
| Output transform 100% | Output Transform, Exact, English 100.00% | 2, 26, 29 | ✓ |
| 99.4% across 10 other languages | Output Transform, Exact, Non-English 99.40%; 10 non-English translations | 2, 32–33 | ✓ |
| John 3:16 (BSB) text | not from the paper: fetched from bible.helloao.org (AO Lab, one of the paper's 4 providers), footnote marker removed | n/a | Verbatim from the API, 2026-11-17 |

## Spoken claims
| Line | Claim | Source |
|---|---|---|
| L1 | words "often come back wrong" | Unassisted 32.6% exact, 47.7% normalized (p.29): wrong more often than not even ignoring punctuation |
| L2 | not a bug; models guess likely words; each guess can drift | "not a defect that better training… will resolve… probabilistic architecture" (p.2); "every decision… is an opportunity for variation" (p.27) |
| L3 | the fix is the method, not a smarter model or new settings | "The solution is not a better model. It is a better harness." (p.2); "Model selection and temperature tuning proved largely irrelevant" (p.3) |
| L4 | five methods, 33,000 times | p.2, p.23–24 |
| L5 | about a third / under half / 93 / 96 | 32.6 / 48.5 / 93.0 / 96.2 (p.29) |
| L6 | one method got every English quote exactly right | Output transform 100% across every model, English translation, passage and temperature (p.2, p.27) |
| L7 | model leaves a placeholder; software fills in exact text from a licensed Bible source | p.2 ("licensed Bible API"), p.22 |
| L8 | on failure you see the reference, not a misquote | "the reader sees an unreplaced reference: a visibly incomplete response, never a false one" (p.2, p.27) |
| L9 | Apologist AI quotes Scripture this way | "The Apologist AI platform has been successfully utilizing the techniques described in this paper" (p.35); the platform's own accuracy is **not** claimed (p.34 says the test harness differs from the platform) |

## Creative choices (not claims)
- `[John 3:16]` placeholder format: illustration only; the paper gives no format.
- The drifting bars and "world / earth / people" next-word candidates illustrate drift; no probabilities are shown.
- Plain labels for methods ("Model alone", "Handed the passage", "Lookup tool") with the paper's names underneath.

## Errors and gaps found in the PDF (none used in the video)
1. "44 to 61 percentage points" (p.3, p.33–34) does not match the gap from output transform (51.5–67.4) or tool calls
   (47.7–63.6); it roughly matches the gap from simulated RAG only (44.5–60.4), with odd rounding.
2. "12.96 pp" non-English drop (p.32) matches the translation-table averages (74.09 vs 61.13); the method tables give 12.8.
3. p.22 says simulated RAG "eliminates F2, F3, F4, F8, F9" and then lists those same five as exposed failure modes.
4. Gruenewald is "president" in the body (p.14) and "CEO" in endnote 13; that quote's source is Christian Daily International
   (Mar 16 2026), not Christianity Today.
5. Typos: "Web English Bible Updated" vs "World English Bible Updated"; "Berean Study Bible" vs "Berean Standard Bible";
   chapter 3 has no section D.
6. The 100% excludes samples discarded after 5 network retries (p.23), and assumes a well-formed reference; the study
   supplied a fixed reference. Hence "never a misquote", not "never a wrong verse".
7. 33,000 covers the English run only; the non-English run's count is not given, so the 99.4% tag carries no count.
8. Recomputed and correct: non-English drops (0.6, 0.8, 10.8, 26.5, 25.3), the 3.8% and 7% complements, 64.5% normalized
   web search, 22.3 pp model spread, 2.5 pp temperature spread.

## Approval
Tier 1 under the Brand Quick Reference (AI ethics): goes to Jake as a draft. No new theological claims: the only Scripture
on screen is John 3:16 quoted verbatim with its reference; L2 to L8 are claims about software, sourced above.
