# 🚀 Demo Plan: PostoAI (Marketing Suite)

## 🎯 1. Project Vision
**PostoAI** is an **AI-as-a-Service** platform designed to revolutionize how Small and Medium Enterprises (SMEs) create visual assets. By leveraging *Stable Diffusion*, PostoAI eliminates the need for expensive commercial photography, offering instant, high-quality marketing content generation.

---

## ⏱️ 2. Demo Flow (6 Minutes)

| Time | Phase | Description |
| :--- | :--- | :--- |
| **0:00 - 1:00** | **Introduction** | Marketing cost challenges and presentation of the minimalist UI. |
| **1:00 - 3:00** | **Live Generation** | Inputting a business prompt (e.g., *Modern tech store*) and live generation. |
| **3:00 - 4:00** | **Art Styles** | Switching between `Realistic` and `Studio` styles to match branding. |
| **4:00 - 5:00** | **Vault & Data** | Saving the image to the "Vault" and managing it via Supabase. |
| **5:00 - 6:00** | **Closing** | Efficiency analysis (Time vs. Cost) and future scalability. |

---

## 🛠️ 3. Technical Pillars
* **Prompt Engineering:** Automatic transformation of simple business ideas into complex 8K-quality prompts.
* **Hugging Face SDK:** Seamless integration of the Inference API for asynchronous image processing.
* **Infrastructure:** Full-stack architecture using **Next.js 14**, **Supabase** for cloud storage, and **Vercel** for hosting.

---

## 📝 4. Pre-Demo Checklist
- [ ] **API Check:** Verify the new Hugging Face token (Fine-grained inference permissions).
- [ ] **Database:** Clear test logs in the `user_activities` table.
- [ ] **Performance:** Ensure no "Cold Start" delays in Next.js API Routes.

## 🆘 5. Plan B (Contingency)
In case of AI server latency, a **"Pre-generated Showreel"** will be used—an in-app gallery showcasing high-quality results from previous successful generations.