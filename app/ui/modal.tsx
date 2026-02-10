import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  type ModalProps,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppModalSize = "sm" | "md" | "lg" | "xl";

export type AppModalProps = Omit<ModalProps, "children" | "size"> & {
  size?: AppModalSize;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const sizeMap: Record<AppModalSize, ModalProps["size"]> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

export function AppModal({
  size = "md",
  title,
  description,
  footer,
  children,
  classNames,
  ...props
}: AppModalProps) {
  return (
    <Modal
      size={sizeMap[size]}
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        base: cn(
          "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]",
          "shadow-[var(--shadow-popover)]",
          classNames?.base
        ),
        header: cn(
          "border-b border-[var(--color-border)]",
          "px-6 py-4",
          classNames?.header
        ),
        body: cn("px-6 py-4", classNames?.body),
        footer: cn(
          "border-t border-[var(--color-border)]",
          "px-6 py-4",
          classNames?.footer
        ),
        backdrop: cn("bg-[var(--color-overlay)]", classNames?.backdrop),
        closeButton: cn("text-[var(--color-muted)]", classNames?.closeButton),
        wrapper: classNames?.wrapper,
      }}
      {...props}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {title ? (
              <ModalHeader>
                <div>
                  <div className="text-lg font-semibold text-[var(--color-text)]">
                    {title}
                  </div>
                  {description ? (
                    <div className="mt-1 text-sm text-[var(--color-muted)]">
                      {description}
                    </div>
                  ) : null}
                </div>
              </ModalHeader>
            ) : null}
            <ModalBody>{children}</ModalBody>
            {footer ? <ModalFooter>{footer}</ModalFooter> : null}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export { ModalBody as AppModalBody, ModalFooter as AppModalFooter };
