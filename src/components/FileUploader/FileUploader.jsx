import React, { useState } from 'react';
import { Upload, FileText, Image, Loader } from 'lucide-react';
import { extractPDFText, extractImageText, analyzeText } from '../utils/textExtraction';
import './FileUploader.css';

const FileUploader = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [extractedText, setExtractedText] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = [...e.dataTransfer.files];
        handleFiles(droppedFiles);
    };

    const handleFileInput = (e) => {
        const selectedFiles = [...e.target.files];
        handleFiles(selectedFiles);
    };

    const handleFiles = async (fileList) => {
        setError('');
        setAnalysis(null);
        setExtractedText('');

        const validFiles = fileList.filter(file =>
            file.type === 'application/pdf' ||
            file.type.startsWith('image/')
        );

        if (validFiles.length === 0) {
            setError('Please upload PDF or image files only');
            return;
        }

        setFiles(validFiles);
        await processFiles(validFiles);
    };

    const processFiles = async (fileList) => {
        setLoading(true);
        try {
            let allText = '';

            for (const file of fileList) {
                let extractedText = '';

                if (file.type === 'application/pdf') {
                    extractedText = await extractPDFText(file);
                } else if (file.type.startsWith('image/')) {
                    extractedText = await extractImageText(file);
                }

                allText += extractedText + '\n\n';
            }

            setExtractedText(allText);
            const analysisResults = analyzeText(allText);
            setAnalysis(analysisResults);
        } catch (err) {
            setError('Error processing files: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-uploader">
            <h1>Social Media Content Analyzer</h1>

            <div
                className="upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    onChange={handleFileInput}
                    accept=".pdf,image/*"
                    className="file-input"
                    id="fileInput"
                    multiple
                />
                <label htmlFor="fileInput" className="upload-label">
                    <Upload className="upload-icon" />
                    <p>Drag & drop files here</p>
                    <p className="upload-hint">or click to browse</p>
                </label>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {files.length > 0 && (
                <div className="file-list">
                    <h3>Uploaded Files:</h3>
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            {file.type === 'application/pdf' ?
                                <FileText size={16} /> :
                                <Image size={16} />
                            }
                            <span>{file.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="loading">
                    <Loader className="spinner" />
                    <p>Analyzing content...</p>
                </div>
            )}

            {extractedText && !loading && (
                <div className="extracted-text">
                    <h3>Extracted Text:</h3>
                    <pre>{extractedText}</pre>
                </div>
            )}

            {analysis && !loading && (
                <div className="analysis-results">
                    <h3>Analysis Results</h3>
                    <div className="score">
                        Engagement Score: {analysis.score}%
                    </div>
                    <div className="suggestions">
                        <h4>Improvement Suggestions:</h4>
                        <ul>
                            {analysis.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;