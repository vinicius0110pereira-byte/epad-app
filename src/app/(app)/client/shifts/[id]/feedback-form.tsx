"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  shiftId: string;
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition"
          >
            <span
              className={
                star <= (hovered || value)
                  ? "text-yellow-400"
                  : "text-slate-300"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedbackForm({ shiftId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingCare, setRatingCare] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setError("Selecione a nota geral");
      return;
    }

    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/shifts/${shiftId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          ratingPunctuality: ratingPunctuality || null,
          ratingCare: ratingCare || null,
          ratingCommunication: ratingCommunication || null,
          notes: form.get("notes") || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar avaliação");
        return;
      }

      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StarRating label="Nota Geral *" value={rating} onChange={setRating} />

      <div className="rounded-lg border border-slate-100 p-3 space-y-3">
        <p className="text-xs font-medium text-slate-500 uppercase">Categorias (opcional)</p>
        <StarRating
          label="Pontualidade"
          value={ratingPunctuality}
          onChange={setRatingPunctuality}
        />
        <StarRating
          label="Qualidade do Cuidado"
          value={ratingCare}
          onChange={setRatingCare}
        />
        <StarRating
          label="Comunicação"
          value={ratingCommunication}
          onChange={setRatingCommunication}
        />
      </div>

      <Textarea
        id="notes"
        name="notes"
        label="Comentário (opcional)"
        placeholder="Como foi o atendimento?"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        Enviar Avaliação
      </Button>
    </form>
  );
}
