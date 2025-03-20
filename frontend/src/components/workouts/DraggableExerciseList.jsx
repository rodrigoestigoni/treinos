import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const DraggableExerciseList = ({ 
  exercises, 
  onReorder, 
  onEdit, 
  onDelete,
  className = "" 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Função para reordenar a lista quando arrastar e soltar
  const handleDragEnd = (result) => {
    setIsDragging(false);
    
    // Desiste se não tiver destino válido
    if (!result.destination) return;
    
    // Desiste se a posição for a mesma
    if (result.destination.index === result.source.index) return;
    
    // Cria uma cópia da lista atual
    const items = Array.from(exercises);
    
    // Remove o item arrastado da lista
    const [removedItem] = items.splice(result.source.index, 1);
    
    // Adiciona o item na nova posição
    items.splice(result.destination.index, 0, removedItem);
    
    // Atualiza a ordem dos exercícios
    onReorder(items);
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  if (!exercises || exercises.length === 0) {
    return (
      <div className={`text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum exercício adicionado ao treino.
        </p>
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <Droppable droppableId="exercises">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-3 ${className}`}
          >
            {exercises.map((exercise, index) => (
              <Draggable 
                key={exercise.id || `exercise-${index}`} 
                draggableId={exercise.id?.toString() || `exercise-${index}`} 
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`border ${
                      exercise.is_superset ? 'border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                    } rounded-lg p-4 ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    } transition-shadow`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {/* Drag handle */}
                        <div 
                          {...provided.dragHandleProps}
                          className="mr-3 cursor-move touch-manipulation"
                        >
                          <div className="flex flex-col items-center w-6 h-6">
                            <div className="w-4 h-0.5 bg-gray-400 dark:bg-gray-500 mb-1 rounded-full"></div>
                            <div className="w-4 h-0.5 bg-gray-400 dark:bg-gray-500 mb-1 rounded-full"></div>
                            <div className="w-4 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                          </div>
                        </div>

                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-lg">
                            {exercise.exercise_detail?.name || exercise.name}
                            {exercise.is_superset && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                                Super Set
                              </span>
                            )}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>{exercise.sets} séries</span>
                            <span>{exercise.target_reps} repetições</span>
                            <span>{exercise.rest_duration}s descanso</span>
                          </div>
                          {exercise.is_superset && exercise.superset_with && exercise.superset_with.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Super set com:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exercise.superset_with.map(exId => (
                                  <span 
                                    key={exId}
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full"
                                  >
                                    {exercises.find(e => e.id === exId || e.exercise_detail?.id === exId)?.name || 
                                     exercises.find(e => e.id === exId || e.exercise_detail?.id === exId)?.exercise_detail?.name || 
                                     'Exercício'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {exercise.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              <span className="font-medium">Notas:</span> {exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => onEdit(index)}
                          className="p-1 text-gray-500 hover:text-primary-600"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(index)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableExerciseList;