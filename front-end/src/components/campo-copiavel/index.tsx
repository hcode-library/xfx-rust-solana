import { useState } from "react";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampoCopiavel({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiarParaClipboard = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error("Falha ao copiar texto: ", err)
    }
  }

  return (
    <div className="space-y-1">
      <div className="font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <div
          onClick={copiarParaClipboard}
          className={cn(
            "bg-gray-100 p-2 rounded-md flex-1 font-mono text-sm break-all cursor-pointer hover:bg-gray-200 transition-colors",
            copiado && "bg-green-50 hover:bg-green-50",
          )}
        >
          {valor}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={copiarParaClipboard}
          className={cn("flex-shrink-0", copiado && "text-green-600 border-green-600")}
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}