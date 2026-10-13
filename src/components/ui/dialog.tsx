import { config } from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { t } from "@/lib/i18n";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  width = "normal",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
  width?: "normal" | "wide";
}) {
  const { prefs } = useBookPreferences();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal-content ${width === "wide" ? "modal-wide" : ""}`}
        >
          <div className="modal-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close
              aria-label={t(prefs.locale).dialogClose}
              className="icon-button"
            >
              <X size={config.appearance.iconSizes["18"]} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
