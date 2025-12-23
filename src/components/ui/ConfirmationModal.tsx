"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, X, CheckCircle2, XCircle, BookOpen, GraduationCap } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "warning" | "danger" | "success" | "info"
  unansweredCount?: number
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  unansweredCount,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          gradient: "from-red-50 to-red-100",
          border: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          cardBg: "bg-white",
          headerBg: "from-red-50 to-red-100",
        }
      case "success":
        return {
          gradient: "from-green-50 to-green-100",
          border: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          confirmButton: "bg-green-600 hover:bg-green-700 text-white",
          cardBg: "bg-white",
          headerBg: "from-green-50 to-green-100",
        }
      case "info":
        return {
          gradient: "from-blue-50 to-blue-100",
          border: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          cardBg: "bg-white",
          headerBg: "from-blue-50 to-blue-100",
        }
      default: // warning
        return {
          gradient: "from-amber-50 to-orange-50",
          border: "border-amber-200",
          iconColor: "text-amber-600",
          titleColor: "text-amber-800",
          confirmButton: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white",
          cardBg: "bg-white",
          headerBg: "from-amber-50 to-orange-50",
        }
    }
  }

  const styles = getTypeStyles()

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle className={`w-8 h-8 sm:w-12 sm:h-12 ${styles.iconColor}`} />
      case "success":
        return <CheckCircle2 className={`w-8 h-8 sm:w-12 sm:h-12 ${styles.iconColor}`} />
      default:
        return <AlertTriangle className={`w-8 h-8 sm:w-12 sm:h-12 ${styles.iconColor}`} />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md ${styles.cardBg} border-2 ${styles.border} shadow-2xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300`}>

        {/* Textbook-style header with binding */}
        <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800"></div>

        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full w-8 h-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardHeader className={`text-center pb-4 sm:pb-6 bg-gradient-to-br ${styles.headerBg}`}>
          {/* Icon */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center shadow-lg border-2 border-amber-200">
              {getIcon()}
            </div>
          </div>

          <CardTitle className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${styles.titleColor}`}>
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Message */}
          <div className="text-center">
            <p className="text-amber-800 text-sm sm:text-base leading-relaxed mb-4 font-medium">{message}</p>

            {/* Unanswered questions warning */}
            {unansweredCount && unansweredCount > 0 && (
              <div className={`p-4 bg-gradient-to-br ${styles.gradient} border-2 ${styles.border} rounded-lg mb-6 shadow-md`}>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
                  <span className={`font-bold ${styles.iconColor} text-sm sm:text-base`}>
                    Warning: Incomplete Questions
                  </span>
                </div>
                <p className="text-amber-700 text-xs sm:text-sm">
                  You have <span className={`font-bold ${styles.iconColor}`}>{unansweredCount}</span> unanswered
                  questions. These will be marked as incorrect if you proceed.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-amber-300 text-amber-700 bg-white hover:bg-amber-50 font-semibold py-3 sm:py-4 text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:shadow-amber-300/20 rounded-lg"
            >
              {cancelText}
            </Button>

            <Button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 ${styles.confirmButton} font-bold py-3 sm:py-4 text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/30 rounded-lg`}
            >
              <span className="flex items-center justify-center gap-2">
                {getIcon()}
                {confirmText}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 