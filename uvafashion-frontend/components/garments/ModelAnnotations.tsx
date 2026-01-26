"use client";

import { useState } from "react";
import { Vector3 } from "three";
import { Html } from "@react-three/drei";
import { X, Info } from "lucide-react";

export interface Annotation {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  category?: "construction" | "material" | "technique" | "history" | "detail";
}

interface ModelAnnotationsProps {
  annotations: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
}

export default function ModelAnnotations({ annotations, onAnnotationClick }: ModelAnnotationsProps) {
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);

  const handleClick = (annotation: Annotation) => {
    if (activeAnnotation === annotation.id) {
      setActiveAnnotation(null);
    } else {
      setActiveAnnotation(annotation.id);
      onAnnotationClick?.(annotation);
    }
  };

  return (
    <>
      {annotations.map((annotation) => {
        const isActive = activeAnnotation === annotation.id;
        const isHovered = hoveredAnnotation === annotation.id;

        return (
          <group key={annotation.id} position={annotation.position}>
            {/* Annotation marker */}
            <mesh
              onClick={() => handleClick(annotation)}
              onPointerEnter={() => setHoveredAnnotation(annotation.id)}
              onPointerLeave={() => setHoveredAnnotation(null)}
            >
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? "#fbbf24" : isHovered ? "#f59e0b" : "#3b82f6"}
                emissive={isActive ? "#fbbf24" : isHovered ? "#f59e0b" : "#3b82f6"}
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Annotation popup */}
            {isActive && (
              <Html
                position={[0, 0.3, 0]}
                center
                distanceFactor={10}
                style={{ pointerEvents: "auto" }}
              >
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 max-w-xs min-w-[250px] text-left">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-zinc-400" />
                      <h3 className="text-sm font-semibold text-zinc-200">
                        {annotation.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveAnnotation(null)}
                      className="text-zinc-400 hover:text-zinc-200 transition-colors"
                      aria-label="Close annotation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {annotation.category && (
                    <span className="inline-block text-xs uppercase tracking-[0.1em] text-zinc-500 mb-2">
                      {annotation.category}
                    </span>
                  )}
                  <p className="text-xs text-zinc-300 font-light leading-relaxed">
                    {annotation.description}
                  </p>
                </div>
              </Html>
            )}

            {/* Hover indicator */}
            {isHovered && !isActive && (
              <Html position={[0, 0.15, 0]} center distanceFactor={10}>
                <div className="bg-zinc-800/90 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200 whitespace-nowrap">
                  {annotation.title}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
