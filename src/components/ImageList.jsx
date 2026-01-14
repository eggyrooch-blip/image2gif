import React, { useState } from 'react';
import { X, GripVertical, Pencil, Clock } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '../contexts/LanguageContext';

const SortableItem = ({
    img,
    index,
    onRemove,
    onEdit,
    onDelayChange,
    globalDelay,
    allowEdit = true,
    allowDelay = true
}) => {
    const [showDelayInput, setShowDelayInput] = useState(false);
    const [localDelay, setLocalDelay] = useState(img.delay ?? '');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    const handleDelaySubmit = () => {
        const value = localDelay === '' ? null : parseInt(localDelay);
        if (value === null || (value >= 10 && value <= 10000)) {
            onDelayChange(img.id, value);
        }
        setShowDelayInput(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleDelaySubmit();
        } else if (e.key === 'Escape') {
            setLocalDelay(img.delay ?? '');
            setShowDelayInput(false);
        }
    };

    const displayDelay = img.delay ?? globalDelay;
    const isCustomDelay = img.delay !== null && img.delay !== undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative bg-white rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing ${isDragging
                ? 'border-blue-500 shadow-xl shadow-blue-500/10 scale-105 ring-2 ring-blue-500/20'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md transition-colors duration-200'
                }`}
        >
            {/* Sequence Badge */}
            <div className="absolute top-2 left-2 z-10">
                <div className="w-6 h-6 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-full text-white text-xs font-bold shadow-sm border border-white/20">
                    {index}
                </div>
            </div>

            {/* Per-Frame Delay Badge */}
            {allowDelay && (
                <div className="absolute bottom-2 right-2 z-10">
                    {showDelayInput ? (
                        <div
                            className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-blue-300 p-1"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <input
                                type="number"
                                value={localDelay}
                                onChange={(e) => setLocalDelay(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleDelaySubmit}
                                placeholder={String(globalDelay)}
                                min="10"
                                max="10000"
                                className="w-16 px-1.5 py-0.5 text-xs border-0 bg-transparent focus:outline-none text-gray-700 font-mono"
                                autoFocus
                            />
                            <span className="text-[10px] text-gray-400 pr-1">ms</span>
                        </div>
                    ) : (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDelayInput(true);
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow-sm backdrop-blur-sm transition-all cursor-pointer ${isCustomDelay
                                ? 'bg-blue-500 text-white border border-blue-400'
                                : 'bg-white/90 text-gray-500 border border-gray-200 opacity-0 group-hover:opacity-100'
                                }`}
                            title="Set custom delay for this frame"
                        >
                            <Clock className="w-3 h-3" />
                            <span>{displayDelay}ms</span>
                        </button>
                    )}
                </div>
            )}

            {/* Visual Grip Indicator (Optional now, but good for affordance) */}
            <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 bg-white/90 rounded-full text-gray-600 shadow-sm border border-gray-100">
                    <GripVertical className="w-4 h-4" />
                </div>
            </div>

            {/* Edit & Remove Buttons - Stop Propagation to prevent drag start */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {allowEdit && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(index - 1);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-blue-50 hover:text-blue-500 rounded-full text-gray-400 shadow-sm border border-gray-100 backdrop-blur-sm transition-colors cursor-pointer"
                        title="Edit frame"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(img.id);
                    }}
                    className="p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 shadow-sm border border-gray-100 backdrop-blur-sm transition-colors cursor-pointer"
                    title="Remove frame"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="aspect-[3/2] relative bg-gray-50 flex items-center justify-center p-2">
                <div className="absolute inset-0 bg-gray-100/50"
                    style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                <img
                    src={img.preview}
                    alt={img.file.name}
                    className="w-full h-full object-contain pointer-events-none relative z-10"
                    draggable={false}
                />
            </div>

            <div className="p-2 border-t border-gray-100 bg-white">
                <p className="text-xs text-gray-600 truncate font-medium" title={img.file.name}>
                    {img.file.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                    {(img.file.size / 1024).toFixed(1)} KB
                </p>
            </div>
        </div>
    );
};

const ImageList = ({
    images,
    onRemove,
    onReorder,
    onOpenEditor,
    onDelayChange,
    globalDelay,
    allowEdit = true,
    allowDelay = true
}) => {
    const { t } = useLanguage();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (images.length === 0) return null;

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);
            const newOrder = arrayMove(images, oldIndex, newIndex);
            onReorder(newOrder);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                <span className="font-medium">
                    {t('imageList.count', { count: images.length, s: images.length !== 1 ? 's' : '' })}
                </span>
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    {t('imageList.hint')}
                </span>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <SortableItem
                                key={img.id}
                                img={img}
                                index={index + 1}
                                onRemove={onRemove}
                                onEdit={onOpenEditor}
                                onDelayChange={onDelayChange}
                                globalDelay={globalDelay}
                                allowEdit={allowEdit}
                                allowDelay={allowDelay}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default ImageList;
