import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

export function useCategories() {
  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    const all = await db.categories.toArray();
    setCategories(all);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories };
}
