# Outreach drafts: Scripture Quotation white paper

Drafts only. Nothing has been sent or posted. Tier 1 under the Brand Quick Reference (AI ethics): Jake approves first.
Source of every claim: the white paper (page numbers in brackets). Not used: anything from the CT article, the YouVersion
CEO's figures, any AI product or model name, the model rankings, the research partners' names.

Placeholders to fill: `[PAPER LINK]` = apologistproject.org/scripture-quotation-in-generative-ai, `[VIDEO LINK]`, `[HARNESS LINK]`
= github.com/apologist-project/llm-scripture-fidelity (taken from the paper's link list; open it before posting), `[Name]`, `[Sender]`.

---

## 1. Email to Christianity Today

**Subject:** A study on how AI quotes Scripture, for your readers

Hello [Name],

I'm writing from The Apologist Project, the team behind Apologist AI. Your recent piece on AI and Scripture is why this note is going to you.

We have published a white paper, "Scripture Quotation in Generative AI," with data on why AI models misquote Scripture and what fixes it. In short:

- We ran 33,000 tests: 5 ways of quoting Scripture, 10 AI models, 10 English translations, 10 passages and 3 temperature settings, then a second run in 10 other languages. [p.2]
- With no help, the model got the exact wording right 32.6% of the time. [p.2]
- One method, an output transform, got every English quote exactly right and scored 99.4% in the other languages. The model leaves a placeholder reference, and the software inserts the exact text from a licensed Bible source. If it fails, the reader sees a gap where the verse should be, not a false verse. [p.2]
- For anyone building with AI, the method matters more than the model or the settings. [p.2, p.3]

The test harness is open source, so anyone can re-run the study. There is a one-minute video summary at [VIDEO LINK] and the paper is at [PAPER LINK].

Jake Carlson, our president and the paper's author, would be glad to talk with you or a contributor, or to answer questions for any follow-up coverage.

Thank you for your attention to this,
[Sender]
The Apologist Project

---

## 2. Email to YouVersion

**Subject:** Scripture quotation study: YouVersion Platform was one of our four test sources

Hello [Name],

I'm writing from The Apologist Project, the team behind Apologist AI. We have published a study of how AI systems quote Scripture, and YouVersion Platform was one of the four Bible APIs we used to run it, alongside AO Lab, API.Bible and the ESV API. [p.21, p.25]

The findings, in brief:

- 33,000 tests across 5 quoting methods, 10 models, 10 English translations, 10 passages and 3 temperature settings. [p.2]
- With no help, the model got the exact wording right 32.6% of the time. [p.2]
- An output transform got every English quote exactly right, and 99.4% in 10 other languages. The model leaves a placeholder reference and the software inserts the exact text from a licensed Bible API. If it fails, the reader sees a gap, not a false verse. [p.2]
- The text is fetched when it is needed and shown by the software. Nothing has to be indexed or copied onto another system. [p.21, p.22]

The paper ends with an open letter to Bible translation licensors, because licenses today largely rule out generative AI use. [p.14, p.35] We think this method shows that faithful, license-respecting quotation is possible, and we would welcome a conversation about what that could look like on your platform. We can walk your team through the data and the open-source harness.

The paper is at [PAPER LINK], the test harness at [HARNESS LINK], and a one-minute video summary at [VIDEO LINK].

With thanks,
[Sender]
The Apologist Project

---

## 3. LinkedIn (B2B)

Ask an AI to quote a Bible verse and the words often come back wrong.

That is not a bug. A model writes by predicting likely words, and every prediction is a chance to drift.

We tested it: 33,000 runs, 5 ways of quoting Scripture, 10 AI models, 10 English translations, 10 passages. What decided the result was the method, not the model or the settings.

Exact match, English translations:
• Model alone: 32.6%
• Web search: 48.5%
• Passage handed to the model: 93.0%
• Lookup tool: 96.2%
• Output transform: 100%

The output transform is simple. The model never writes the verse. It leaves a placeholder, like [John 3:16], and the software inserts the exact text from a licensed Bible source. If something fails, the reader sees a gap where the verse should be, not a false verse. Across 10 non-English translations it scored 99.4%.

One limit: the study tested quoting a passage the system had already chosen. Choosing the right passage is a separate question.

If you build with AI, put your effort into the layer around the model. The paper, the open-source test harness and a one-minute video are here: [PAPER LINK]

Building something similar? Book a free consultation: [LINK]

---

## 4. Facebook (D2C)

Ever asked an AI for a Bible verse and wondered if the words were really right?

We looked into it. In a study of 33,000 tests, an AI quoting from its own memory got the exact words right about a third of the time (32.6%). It writes by guessing the next likely word, and Scripture needs every word exactly.

So we changed how the quoting works. The AI doesn't write the verse. It points to the passage, like John 3:16, and the software drops in the exact text from a licensed Bible source. In our test, that got every English quote exactly right. And if something goes wrong, you see an empty gap instead of a wrong verse.

That's how Apologist AI quotes Scripture. Watch the one-minute video, read the study, and try it at apologist.ai

[VIDEO]  [PAPER LINK]

---

## 5. X

**Post:**
AI models often misquote Scripture. They predict likely words, so every guess can drift.

We tested 5 ways to quote the Bible, 33,000 times. Model alone: 32.6% exact. Placeholder plus verified text: 100%.

Study and 1 min video: [PAPER LINK]

**Thread (optional):**
2/ The method: the model leaves a placeholder like [John 3:16]. The software inserts the exact text from a licensed Bible source.

3/ If something fails, you see a gap where the verse should be. Never a false verse.

4/ It held across every English translation we tested, and scored 99.4% in 10 other languages. Once the method is right, model and settings matter much less.

5/ Paper, open-source test harness and the video: [PAPER LINK] [HARNESS LINK]. Try it at apologist.ai
