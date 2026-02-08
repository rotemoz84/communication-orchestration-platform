# 📞 IVR & WhatsApp Bot - Flow Diagram

---

## Phone Call Flow

```
                         📞 Incoming Call
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Office Open?      │
                    └─────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
           ✅ YES                            ❌ NO
              │                                 │
              ▼                                 ▼
    ┌───────────────────┐             ┌───────────────────┐
    │ 📱 Send WhatsApp  │             │  "We're closed"   │
    │   (website link)  │             │                   │
    │         +         │             │  📱 Send WhatsApp │
    │ 📞 Forward to Rep │             │   (start bot)     │
    └─────────┬─────────┘             └───────────────────┘
              │
              ▼
       ┌─────────────┐
       │ Rep answered?│
       └──────┬──────┘
              │
       ┌──────┴──────┐
       │             │
      ✅            ❌
       │             │
       ▼             ▼
     Done    ┌─────────────────┐
             │ 📱 Send WhatsApp│
             │   (start bot)   │
             └─────────────────┘
```

---

## WhatsApp Bot Flow

```
        📱 WhatsApp Message Received
                    │
                    ▼
         ┌─────────────────────┐
         │  "שלום! 👋          │
         │   Click to start"   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   What would you    │
         │   like to do?       │
         │                     │
         │  [1] Office Info    │
         │  [2] Leave Message  │
         │  [3] Website Link   │
         └──────────┬──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
       [1]         [2]         [3]
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌─────────────┐
│ 🏢 Working  │ │ 📝 Enter│ │ 🌐 Website  │
│    Hours    │ │  your   │ │    Link     │
│             │ │ message │ │             │
│ [Back][Msg] │ └────┬────┘ │ [New chat]  │
└─────────────┘      │      └─────────────┘
                     ▼
             ┌─────────────┐
             │ 💾 Saved to │
             │ Google Sheet│
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ ✅ Thank you│
             │             │
             │ [New chat]  │
             └─────────────┘
```

---

## Quick Reference

| Trigger | Action |
|---------|--------|
| Call when **open** | Forward to rep + WhatsApp (website link) |
| Call when **closed** | WhatsApp (start bot) |
| Rep **no answer** | WhatsApp (start bot) |
| WhatsApp **"1"** | Show office hours |
| WhatsApp **"2"** | Collect message → save |
| WhatsApp **"3"** | Send website link |
