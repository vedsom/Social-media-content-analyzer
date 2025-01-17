// Utility functions for file handling
export const validateFile = (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};