import { useEffect } from "react";
import { appConfig } from "@/app/config";

export const usePageTitle = (title: string): void => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${appConfig.name}` : appConfig.name;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
