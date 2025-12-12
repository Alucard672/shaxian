import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
    id: string
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}

export function SortableItem({ id, label, checked, onChange }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative' as const,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2 bg-white border rounded-lg ${isDragging ? 'shadow-lg border-primary-500' : 'border-gray-200'
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
                <GripVertical className="w-4 h-4" />
            </div>
            <input
                type="checkbox"
                id={`product_${id}`}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label
                htmlFor={`product_${id}`}
                className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
            >
                {label}
            </label>
        </div>
    )
}
