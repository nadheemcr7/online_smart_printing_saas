import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const extension = file.name.split('.').pop()?.toLowerCase();
        let pageCount = 1;

        if (extension === 'pdf') {
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            pageCount = pdfDoc.getPageCount();
        } else if (extension === 'docx') {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const appXml = await zip.file("docProps/app.xml")?.async("text");
            if (appXml) {
                const match = appXml.match(/<Pages>(\d+)<\/Pages>/);
                if (match && match[1]) {
                    pageCount = parseInt(match[1]);
                }
            }
        }

        return NextResponse.json({ pages: pageCount });
    } catch (error) {
        console.error('Error analyzing file:', error);
        return NextResponse.json({ error: 'Failed to analyze file' }, { status: 500 });
    }
}
