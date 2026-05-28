import { useState } from "react";

export default function FoodAdjustModal({ food, onAdd, onClose }) {

  const [grams, setGrams] = useState(food.servingSize || 100);

  const factor = grams / (food.servingSize || 100);

  const calories = Math.round(food.calories * factor);
  const protein = (food.protein * factor).toFixed(1);
  const carbs = (food.carbs * factor).toFixed(1);
  const fats = (food.fats * factor).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

      <div className="bg-white p-6 rounded-xl w-80">

        <h2 className="text-lg font-semibold mb-2">{food.name}</h2>

        <p className="text-sm text-gray-500 mb-4">
          Adjust serving size
        </p>

        <input
          type="range"
          min="10"
          max="500"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="w-full"
        />

        <p className="text-center mt-2">{grams} g</p>

        <div className="mt-4 space-y-1 text-sm">

          <p>Calories: {calories}</p>
          <p>Protein: {protein} g</p>
          <p>Carbs: {carbs} g</p>
          <p>Fats: {fats} g</p>

        </div>

        <button
          onClick={() =>
            onAdd({
              name: food.name,
              calories,
              protein,
              carbs,
              fats
            })
          }
          className="mt-4 w-full bg-indigo-600 text-white py-2 rounded"
        >
          Add Food
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full text-gray-500"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}