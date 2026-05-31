import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Plus, Sparkles } from "lucide-react";
import { api } from "../api";
import FoodAdjustModal from "./FoodAdjustModal";

export default function PhotoAnalyzer({ onAdd, mealType = "snacks", onClose }) {
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState(null);
  const [error, setError] = useState("");
  const [adjustingFood, setAdjustingFood] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      setImageData(dataUrl.split(",")[1]);
      setMediaType(file.type || "image/jpeg");
      setFoods(null);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.analyzeFood(imageData, mediaType);
      setFoods(res.data.foods);
    } catch {
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFoodAdd = (food, selectedMeal) => {
    onAdd(food, selectedMeal);
    setAdjustingFood(null);
  };

  return (
    <>
      {adjustingFood && (
        <FoodAdjustModal
          food={adjustingFood}
          mealType={mealType}
          onAdd={handleFoodAdd}
          onClose={() => setAdjustingFood(null)}
        />
      )}

      <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">AI Feature</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Photo Calorie Analyzer</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">

            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
              >
                <Upload size={20} className="text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Choose Photo</span>
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
              >
                <Camera size={20} className="text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Take Photo</span>
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />

            {/* Preview */}
            {preview && (
              <div className="relative">
                <img src={preview} alt="Food to analyze" className="w-full h-48 object-cover rounded-xl border border-slate-100 dark:border-slate-700" />
                <button
                  onClick={() => { setPreview(null); setImageData(null); setFoods(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}

            {/* Analyze button */}
            {imageData && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Analyzing with AI…</>
                ) : (
                  <><Sparkles size={15} /> Analyze Food</>
                )}
              </button>
            )}

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
            )}

            {/* Results */}
            {foods !== null && (
              foods.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                  No food items detected. Try a clearer photo.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Detected {foods.length} item{foods.length !== 1 ? "s" : ""} — tap + to adjust &amp; add
                  </p>
                  {foods.map((food, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{food.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fats}g
                        </p>
                      </div>
                      <button
                        onClick={() => setAdjustingFood({ ...food, servingSize: 100 })}
                        className="w-8 h-8 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center flex-shrink-0"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {!preview && !foods && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 pb-2">
                Take or upload a photo of your meal and AI will estimate the calories and macros.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
