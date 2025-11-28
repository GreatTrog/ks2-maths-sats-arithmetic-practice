import React, { useRef, useEffect, useState } from 'react';
import { Question } from '../types';

interface WorkingOutCanvasProps {
    isVisible: boolean;
    onClose: () => void;
    question: Question | null;
}

const WorkingOutCanvas: React.FC<WorkingOutCanvasProps> = ({ isVisible, onClose, question }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#000000');

    // Color palette for the swatches
    const colors = [
        '#000000', // Black
        '#EF4444', // Red
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Orange
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#14B8A6', // Teal
    ];

    // Initialize canvas context once
    useEffect(() => {
        if (canvasRef.current && !context) {
            const renderCtx = canvasRef.current.getContext('2d');
            if (renderCtx) {
                renderCtx.lineCap = 'round';
                renderCtx.lineJoin = 'round';
                renderCtx.lineWidth = 3;
                renderCtx.strokeStyle = selectedColor;
                setContext(renderCtx);
            }
        }
    }, [context, selectedColor]);

    // Size canvas when first shown
    useEffect(() => {
        if (isVisible && canvasRef.current && canvasRef.current.parentElement && context && !isInitialized) {
            const parent = canvasRef.current.parentElement;
            canvasRef.current.width = parent.clientWidth;
            canvasRef.current.height = parent.clientHeight;

            // Re-apply context settings
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 3;
            context.strokeStyle = selectedColor;

            setIsInitialized(true);
        }
    }, [isVisible, context, isInitialized, selectedColor]);

    // Clear canvas when question changes
    const clearCanvas = () => {
        if (context && canvasRef.current) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    useEffect(() => {
        if (question) {
            clearCanvas();
            setIsInitialized(false); // Reset initialization for new question
        }
    }, [question]);

    // Update stroke color when selected color changes
    useEffect(() => {
        if (context) {
            context.strokeStyle = selectedColor;
        }
    }, [selectedColor, context]);

    // Drawing handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!context) return;
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        context.beginPath();
        context.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !context) return;
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        if (!context) return;
        context.closePath();
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 ${!isVisible ? 'hidden' : ''}`}>
            <div className="bg-white w-full h-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-primary">
                {/* Header */}
                <div className="bg-primary p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            ✏️ Working Out
                        </h2>
                        {question && (
                            <div className="bg-white/20 px-4 py-1 rounded-lg text-xl font-mono font-bold">
                                {question.text}
                            </div>
                        )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2 bg-white/20 p-2 rounded-xl">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${selectedColor === color
                                            ? 'ring-4 ring-white shadow-lg scale-110'
                                            : 'ring-2 ring-white/50'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={`Select ${color}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={clearCanvas}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors text-sm"
                        >
                            Clear
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-primary hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-yellow-50 cursor-crosshair touch-none">
                    {/* Grid lines for "paper" feel */}
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                    </div>

                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkingOutCanvas;
