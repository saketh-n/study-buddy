import { jsPDF } from 'jspdf';
import type { Flashcard } from '../types';

export const exportFlashcardsAsPDF = (flashcards: Flashcard[]) => {
  if (flashcards.length === 0) {
    alert('No flashcards to export!');
    return;
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    return lines;
  };

  // Add title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Study Flashcards', margin, yPosition);
  yPosition += 12;

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Exported: ${exportDate}`, margin, yPosition);
  yPosition += 10;

  // Add summary
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Flashcards: ${flashcards.length}`, margin, yPosition);
  yPosition += 15;

  // Group flashcards by subject
  const flashcardsBySubject = flashcards.reduce((acc, flashcard) => {
    const subject = flashcard.subject || 'General';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(flashcard);
    return acc;
  }, {} as Record<string, Flashcard[]>);

  const subjects = Object.keys(flashcardsBySubject).sort();

  // Iterate through subjects
  subjects.forEach((subject, subjectIndex) => {
    const subjectFlashcards = flashcardsBySubject[subject];

    // Check if we need a new page for subject header
    checkPageBreak(20);

    // Add subject header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204); // Blue color
    doc.text(subject, margin, yPosition);
    yPosition += 8;

    // Add subject underline
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 10;

    // Add flashcards for this subject
    subjectFlashcards.forEach((flashcard, cardIndex) => {
      // Estimate space needed for this flashcard
      const topicLines = wrapText(flashcard.topic, contentWidth - 10, 14);
      const explanationLines = wrapText(flashcard.explanation, contentWidth - 10, 11);
      const estimatedSpace = 10 + topicLines.length * 5 + explanationLines.length * 5 + 8;

      checkPageBreak(estimatedSpace);

      // Add topic (subheader)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      topicLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += i === 0 ? 6 : 5;
      });

      // Add explanation (body)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      
      explanationLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });

      // Add spacing after each flashcard
      yPosition += 8;

      // Add a light separator line between flashcards (except for the last one)
      if (cardIndex < subjectFlashcards.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, yPosition - 4, pageWidth - margin - 5, yPosition - 4);
      }
    });

    // Add extra spacing after each subject (except for the last one)
    if (subjectIndex < subjects.length - 1) {
      yPosition += 10;
    }
  });

  // Add footer to all pages
  const totalPages = doc.internal.pages.length - 1; // Subtract 1 because first element is metadata
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generate filename with date
  const filename = `Study_Flashcards_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};

