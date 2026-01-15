import pdfplumber
from typing import List, Dict, Any
import re

class PDFParser:
    """Parse PDF contracts and extract text with structure"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    def extract_text(self) -> Dict[str, Any]:
        """Extract text from PDF with page information"""
        text_content = []
        metadata = {}
        
        try:
            with pdfplumber.open(self.file_path) as pdf:
                metadata['total_pages'] = len(pdf.pages)
                metadata['title'] = pdf.metadata.get('Title', '') if pdf.metadata else ''
                
                for page_num, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()
                    if text:
                        text_content.append({
                            'page': page_num,
                            'text': text,
                            'word_count': len(text.split())
                        })
        except Exception as e:
            raise Exception(f"Error parsing PDF: {str(e)}")
        
        return {
            'content': text_content,
            'metadata': metadata,
            'full_text': '\n\n'.join([p['text'] for p in text_content])
        }
    
    def extract_sections(self) -> List[Dict[str, str]]:
        """Extract sections based on headings"""
        data = self.extract_text()
        full_text = data['full_text']
        
        # Common contract section patterns
        section_patterns = [
            r'\n\d+\.\s+[A-Z][A-Za-z\s]+\n',
            r'\n[A-Z][A-Z\s]+\n',
            r'\nArticle\s+\d+',
        ]
        
        sections = []
        for pattern in section_patterns:
            matches = re.finditer(pattern, full_text)
            for match in matches:
                sections.append({
                    'heading': match.group().strip(),
                    'start_pos': match.start()
                })
        
        sections.sort(key=lambda x: x['start_pos'])
        
        for i, section in enumerate(sections):
            start = section['start_pos']
            end = sections[i + 1]['start_pos'] if i < len(sections) - 1 else len(full_text)
            section['content'] = full_text[start:end].strip()
        
        return sections


class DOCXParser:
    """Parse DOCX contracts"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
    
    def extract_text(self) -> Dict[str, Any]:
        from docx import Document
        
        try:
            doc = Document(self.file_path)
            paragraphs = []
            
            for para in doc.paragraphs:
                if para.text.strip():
                    paragraphs.append({
                        'text': para.text,
                        'style': para.style.name
                    })
            
            return {
                'paragraphs': paragraphs,
                'full_text': '\n\n'.join([p['text'] for p in paragraphs]),
                'metadata': {
                    'total_paragraphs': len(paragraphs)
                }
            }
        except Exception as e:
            raise Exception(f"Error parsing DOCX: {str(e)}")
