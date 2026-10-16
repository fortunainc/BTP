"""Render the canonical vision with ReportLab; no external services or secrets."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
root=Path(__file__).resolve().parents[2]
source=root/'docs/vision/BTP_FINAL_VISION.md'
out=root/'output/pdf/BTP_Final_Vision_2026-10-16.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
for name,size,leading,color,after in [('Title',26,30,'#3A1A1E',16),('Heading2',19,23,'#3A1A1E',12),('Heading3',12,16,'#9C7A3C',6),('BodyText',10,14,'#3A1A1E',9)]:
 styles[name].fontName='Helvetica-Bold' if name!='BodyText' else 'Helvetica'
 styles[name].fontSize=size;styles[name].leading=leading;styles[name].textColor=HexColor(color);styles[name].spaceAfter=after
 styles[name].alignment=TA_LEFT
story=[]
for block in source.read_text().split('\n\n'):
 block=block.strip()
 if not block:continue
 if block=='<!-- pagebreak -->':story.append(PageBreak());continue
 if block.startswith('# '):style='Title';block=block[2:]
 elif block.startswith('## '):style='Heading2';block=block[3:]
 elif block.startswith('### '):style='Heading3';block=block[4:]
 else:style='BodyText'
 story.append(Paragraph(escape(block).replace('\n',' '),styles[style]))
def decorate(canvas,doc):
 canvas.setFillColor(HexColor('#EFE6D8'));canvas.rect(0,0,612,792,fill=1,stroke=0)
 canvas.setFillColor(HexColor('#3A1A1E'));canvas.setFont('Helvetica-Bold',9);canvas.drawString(46,762,'BTP  /  BEHIND THE PROTOCOL')
 canvas.setFont('Helvetica',8);canvas.drawRightString(566,762,'FINAL COMPANY VISION  |  16 OCT 2026')
 canvas.setStrokeColor(HexColor('#CBB9A6'));canvas.line(46,750,566,750);canvas.line(46,40,566,40)
 canvas.setFont('Helvetica',8);canvas.drawString(46,26,'Canonical source: docs/vision/BTP_FINAL_VISION.md  |  Version 1.0');canvas.drawRightString(566,26,str(doc.page))
SimpleDocTemplate(str(out),pagesize=(612,792),rightMargin=46,leftMargin=46,topMargin=58,bottomMargin=55,title='BTP | Final Company Vision',author='BTP / Sasha Sinclair').build(story,onFirstPage=decorate,onLaterPages=decorate)
print(out)
