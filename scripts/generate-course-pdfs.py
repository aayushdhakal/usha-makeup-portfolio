"""Regenerate public course PDFs from lib/academy.ts. Requires Node 22+ and reportlab."""
from pathlib import Path
import json,subprocess
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e','import(process.argv[1]).then(m=>process.stdout.write(JSON.stringify(m.allAcademyCourses)))',(ROOT/'lib/academy.ts').as_uri()],cwd=ROOT,text=True))
DEST=ROOT/'public/courses'; DEST.mkdir(parents=True,exist_ok=True)
PLUM=colors.HexColor('#64314f'); INK=colors.HexColor('#302530')
body=ParagraphStyle('Body',fontName='Helvetica',fontSize=10.2,leading=14,textColor=INK)
number=ParagraphStyle('Number',fontName='Helvetica-Bold',fontSize=9,leading=14,textColor=PLUM)
heading=ParagraphStyle('Heading',fontName='Helvetica',fontSize=25,leading=30,textColor=INK,spaceAfter=12)
small=ParagraphStyle('Small',fontName='Helvetica',fontSize=10,leading=15,textColor=colors.HexColor('#796a76'))
logo=ROOT/'public/usha-logo-dark.png'
def page(canvas,doc):
 canvas.saveState(); width,height=A4
 canvas.setFillColor(colors.HexColor('#faf7f3'));canvas.rect(0,height-84,width,84,fill=1,stroke=0)
 if logo.exists():canvas.drawImage(str(logo),42,height-72,width=48,height=60,preserveAspectRatio=True,mask='auto')
 canvas.setFillColor(PLUM);canvas.setFont('Helvetica-Bold',10);canvas.drawString(110,height-39,'USHA ACADEMY')
 canvas.setFont('Helvetica',9);canvas.setFillColor(INK);canvas.drawString(110,height-55,'Makeup, hairstyling and nail courses')
 canvas.setStrokeColor(colors.HexColor('#e6d9df'));canvas.line(44,51,width-44,51)
 canvas.setFont('Helvetica',8);canvas.setFillColor(PLUM);canvas.drawString(44,36,'ushamakeup.com  |  +977 9817077567')
 canvas.linkURL('https://ushamakeup.com/academy/',(44,30,230,45),relative=0)
 canvas.setFillColor(colors.HexColor('#796a76'));canvas.drawRightString(width-44,36,f'Page {doc.page}')
 canvas.restoreState()
for course in DATA:
 path=DEST/(course['slug']+'.pdf')
 doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=108,bottomMargin=72,title=course['title']+' | Usha Academy',author='Usha Makeup & Nails')
 story=[Paragraph(escape(course['title']),heading),Paragraph(f"{course['days']} days &nbsp; | &nbsp; Course curriculum",small),Spacer(1,23)]
 lessons=course['lessons']; split=(len(lessons)+1)//2; rows=[]
 for i in range(split):
  row=[]
  for ix in [i,i+split]:
   if ix<len(lessons):
    label=f'Day {ix+1}' if course['category']=='hair' else f'{ix+1:02}'
    row.extend([Paragraph(label,number),Paragraph(escape(lessons[ix]),body)])
   else:row.extend(['',''])
  rows.append(row)
 width=A4[0]-88
 table=Table(rows,colWidths=[52,width/2-52,52,width/2-52],hAlign='LEFT')
 table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#f4edf1'),colors.white]),('LINEBEFORE',(2,0),(2,-1),.5,colors.HexColor('#e6d9df'))]))
 story.extend([table,Spacer(1,24),Paragraph('For current fees, class dates and registration, contact Usha Makeup &amp; Nails.<br/>New Baneshwor, Kathmandu &nbsp; | &nbsp; ushamua02@gmail.com',small)])
 doc.build(story,onFirstPage=page,onLaterPages=page)
 print(path.name)
