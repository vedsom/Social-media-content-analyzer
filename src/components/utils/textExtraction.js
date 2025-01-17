import Tesseract from 'tesseract.js';

// Extract text from PDF
export const extractPDFText = async (file) => {
    try {
        // Create script elements for PDF.js and worker
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);

        // Wait for script to load
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });

        // Initialize PDF.js worker
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Load and process PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);

            try {
                // Try to get text content first
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                let pageText = strings.join(' ');

                // If extracted text is too short or empty, try OCR
                if (pageText.trim().length < 50) {
                    // Convert PDF page to canvas
                    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    // Use Tesseract OCR on the canvas
                    const { createWorker } = Tesseract;
                    const worker = await createWorker('eng');
                    const { data: { text: ocrText } } = await worker.recognize(canvas);
                    await worker.terminate();

                    pageText = ocrText || pageText; // Use OCR text if available
                }

                fullText += pageText + '\n\n';
            } catch (pageError) {
                console.error(`Error processing page ${i}:`, pageError);
                // Continue with next page if one fails
                continue;
            }
        }

        // Clean up
        document.head.removeChild(script);

        // If no text was extracted, throw an error
        if (!fullText.trim()) {
            throw new Error('No text could be extracted from the PDF');
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        if (error.message.includes('No text could be extracted')) {
            throw new Error('Could not extract text from this certificate. Please ensure the PDF is not secured or damaged.');
        }
        throw new Error('Failed to process the PDF. Please try again with a different file.');
    }
};








// Extract text from Image using OCR
export const extractImageText = async (file) => {
    try {
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng');

        const imageUrl = URL.createObjectURL(file);
        const { data: { text } } = await worker.recognize(imageUrl);

        await worker.terminate();
        URL.revokeObjectURL(imageUrl);

        return text;
    } catch (error) {
        console.error('Error extracting image text:', error);
        throw new Error('Failed to extract text from image');
    }
};

// Analyze text for engagement
export const analyzeText = (text) => {
    const analysis = {
        score: 0,
        suggestions: []
    };

    // Calculate word count
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;

    // Check for hashtags
    const hashtags = text.match(/#[a-zA-Z0-9]+/g) || [];

    // Check for mentions
    const mentions = text.match(/@[a-zA-Z0-9]+/g) || [];

    // Check for questions (engagement markers)
    const questions = text.match(/\?/g) || [];

    // Check for emoji presence
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji})/gu;
    const emojis = text.match(emojiRegex) || [];

    // Calculate base score
    let score = 50; // Base score

    // Adjust score based on content
    if (wordCount >= 50 && wordCount <= 200) score += 10;
    if (hashtags.length > 0) score += hashtags.length * 5;
    if (mentions.length > 0) score += mentions.length * 3;
    if (questions.length > 0) score += questions.length * 5;
    if (emojis.length > 0) score += Math.min(emojis.length * 2, 10);

    // Cap score at 100
    analysis.score = Math.min(score, 100);

    // Generate suggestions
    if (hashtags.length === 0) {
        analysis.suggestions.push('Add relevant hashtags to increase visibility');
    } else if (hashtags.length > 5) {
        analysis.suggestions.push('Consider using fewer hashtags for better engagement');
    }

    if (wordCount < 50) {
        analysis.suggestions.push('Consider adding more content for better context');
    } else if (wordCount > 200) {
        analysis.suggestions.push('Consider shortening the content for better engagement');
    }

    if (questions.length === 0) {
        analysis.suggestions.push('Add questions to encourage audience interaction');
    }

    if (emojis.length === 0) {
        analysis.suggestions.push('Add relevant emojis to make the content more engaging');
    }

    if (mentions.length === 0) {
        analysis.suggestions.push('Consider tagging relevant accounts to increase reach');
    }

    return analysis;
};