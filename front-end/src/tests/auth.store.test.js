import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "../stores/auth";

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("logout vide l'utilisateur et supprime le token", () => {
    localStorage.setItem("token", "fake-token");

    const store = useAuthStore();
    store.user = { id: 1, email: "test@example.com", role: "user" };
    store.token = "fake-token";

    store.logout();

    expect(store.user).toBe(null);
    expect(store.token).toBe(null);
    expect(localStorage.getItem("token")).toBe(null);
  });
});
