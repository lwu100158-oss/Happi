import React, { useState } from "react";
import { ArrowLeft, Send, Hash, Image as ImageIcon, Lock, Globe, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { extractHashtags } from "../data";
import { compressImage } from "../utils";

interface CreatePostPageProps {
  onBack: () => void;
  onSubmitPost: (data: {
    content: string;
    imageUrl?: string;
    isPrivate: boolean;
    hashtags: string[];
  }) => Promise<void>;
}

const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80",
];

const SUGGESTED_HASHTAGS = ["happi", "日常生活", "清新薄荷", "心情記事", "美食探店", "照片分享"];

export const CreatePostPage: React.FC<CreatePostPageProps> = ({
  onBack,
  onSubmitPost,
}) => {
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>("");

  const currentHashtags = extractHashtags(content);

  const handleAddHashtag = (tag: string) => {
    if (content.includes(`#${tag}`)) return;
    setContent((prev) => (prev ? `${prev} #${tag}` : `#${tag}`));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
        setSelectedImage(compressedDataUrl);
      } catch (err) {
        console.error("Post image compression failed:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(
      isPrivate
        ? "正為您發布私人貼文..."
        : "AI 審查中：正在檢查內容適宜度與觀看年齡層分級..."
    );

    try {
      await onSubmitPost({
        content: content.trim(),
        imageUrl: selectedImage,
        isPrivate,
        hashtags: currentHashtags,
      });
    } catch (err) {
      console.error(err);
      setSubmitStatus("發布遭遇問題，請稍後重試");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 bg-white border-b border-emerald-100 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>

          <h1 className="text-base font-bold text-slate-800 flex items-center gap-1">
            發布新貼文
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </h1>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-sm shadow-emerald-200 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSubmitting ? "審查發布中" : "發布"}</span>
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-4">
        {/* Status notice card when submitting */}
        {isSubmitting && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-800 font-medium">{submitStatus}</div>
          </div>
        )}



        {/* Visibility Selector */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">貼文可見範圍</span>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isPrivate
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              公開 (經AI審查)
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isPrivate
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              私人 (免審查)
            </button>
          </div>
        </div>

        {/* Text Area Input */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享此刻的快樂心情...（輸入 #hashtag 可建立標籤，如 #happi #日常）"
            className="w-full h-40 resize-none bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none leading-relaxed"
          />

          {/* Real-time Detected Hashtags preview */}
          {currentHashtags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">偵測到的標籤：</span>
              {currentHashtags.map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hashtags Quick Add */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Hash className="w-4 h-4 text-emerald-500" />
            快速加入熱門 #hashtag
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_HASHTAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddHashtag(tag)}
                className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Image Attachment Section */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              附上圖片 (選填)
            </span>
            {selectedImage && (
              <button
                type="button"
                onClick={() => setSelectedImage(undefined)}
                className="text-xs text-rose-500 hover:underline font-medium"
              >
                移除圖片
              </button>
            )}
          </div>

          {selectedImage ? (
            <div className="relative rounded-xl overflow-hidden max-h-60 border border-slate-200">
              <img
                src={selectedImage}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block w-full py-4 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition-all">
                <span className="text-xs text-slate-500 block font-medium">
                  點擊上傳本機圖片
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <p className="text-[11px] text-slate-400 text-center">或選擇精選高畫質圖片：</p>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-emerald-400 transition-all"
                  >
                    <img src={img} alt="Preset thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
