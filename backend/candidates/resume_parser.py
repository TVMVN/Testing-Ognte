import re
from pdfminer.high_level import extract_text
from docx import Document
from transformers import pipeline
from typing import Dict, List
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

class ResumeParser:
    def __init__(self):
        self.ner = pipeline("ner", model="bert-base-uncased", aggregation_strategy="simple")
        self.skill_pattern = re.compile(r"(?i)(python|react|django|machine\s*learning|sql)", re.IGNORECASE)
        self.education_pattern = re.compile(r"(?i)(b\.?sc|bachelor|m\.?sc|phd|degree)", re.IGNORECASE)

    def extract_text_from_file(self, file_path: str) -> str:
        if file_path.lower().endswith('.pdf'):
            return self._extract_text_from_pdf(file_path)
        elif file_path.lower().endswith('.docx'):
            return self._extract_text_from_docx(file_path)
        else:
            raise ValueError("Unsupported file format. Use PDF or DOCX.")

    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        text = extract_text(pdf_path)
        return self._clean_text(text)

    def _extract_text_from_docx(self, docx_path: str) -> str:
        doc = Document(docx_path)
        return self._clean_text(" ".join([para.text for para in doc.paragraphs]))

    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,-]', '', text)
        return text.strip()

    def extract_entities(self, resume_text: str) -> Dict[str, List[str]]:
        entities = self.ner(resume_text)
        skills = list({e["word"] for e in entities if e["entity_group"] == "SKILL"})
        education = list({e["word"] for e in entities if e["entity_group"] == "EDU"})
        if not skills:
            skills = list(set(self.skill_pattern.findall(resume_text)))
        if not education:
            education = list(set(self.education_pattern.findall(resume_text)))
        return {"skills": skills, "education": education}

    def calculate_score(self, skills: list) -> int:
        return len(skills) * 2

    def analyze_resume(self, file_path: str) -> dict:
        text = self.extract_text_from_file(file_path)
        entities = self.extract_entities(text)
        score = self.calculate_score(entities.get("skills", []))
        return {
            "skills": entities.get("skills", []),
            "education": entities.get("education", []),
            "score": score
        }
