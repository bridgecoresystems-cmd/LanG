# Инструкция по исправлению git истории

## Коммиты которые нужно исправить:

| Старый хеш | Старое сообщение | Новое сообщение |
|------------|------------------|-----------------|
| d90cea0f | `feat(accounting): продвинутая бухгалтерия LanG School` | `feat(accounting): implement advanced accounting system for LanG School` |
| df7282bc | `feat(language-school): кабинет учителя — уроки, список учеников, авто-переключение группы` | `feat(teacher): add lessons, student list, and auto-group switching` |
| 8565bcac | `fix: исправить редирект после логина и ссылки в navbar` | `fix(auth): resolve redirect after login and navbar links` |
| 548aef12 | `docs: обновить README с BridgeCore брендингом и добавить документацию` | `docs: update README with BridgeCore branding and documentation` |
| 84e06936 | `refactoring index.ts w backende` | `refactor(backend): restructure index.ts entry point` |
| 96e076c3 | `nachali delat stranicy uchiteley i uchenikow` | `feat(frontend): create teacher and student pages` |
| 66c39b6b | `djag+elysia.js` | `chore: add Elysia.js debugging configuration` |
| 4e54fa7f | `commit perd payments` | `fix(payments): resolve payment processing issues` |
| 9b1d4354 | `feat(cabinet): расписание, курсы учителя/студента, исправления сайдбара` | `feat(cabinet): add schedule, teacher/student courses, sidebar fixes` |
| f76d572a | `feat: добавлен модуль Sales для управления звонками менеджеров` | `feat(sales): add CRM module for manager call management` |

---

## Способ 1: Интерактивный rebase (рекомендуется)

```bash
cd /home/batyr/projects/LanG

# Начать интерактивный rebase (последние 20 коммитов)
git rebase -i HEAD~20
```

В редакторе измени `pick` на `reword` для коммитов с русским текстом:

```
pick da816970 feat(lessons): improve lesson management and fix UI issues
pick 53bb48c3 feat(chat): add real-time teacher-student messaging system
pick 1a33e49f docs: add GitHub portfolio preparation guide
pick 4dc5c312 docs: add comprehensive documentation for GitHub portfolio
pick 0602241b refactor(auth): migrate from Lucia Auth to Better Auth
reword d90cea0f feat(accounting): продвинутая бухгалтерия LanG School
pick 9e477ada feat(accountant): add head accountant role and transaction management
pick 1a3e5c26 feat(accountant): add professional school-based access control
pick 5dc6d41a feat(accountant): add accountant role and payment management system
reword 4e54fa7f commit perd payments
reword df7282bc feat(language-school): кабинет учителя — уроки, список учеников
pick 04d5405a refactor: split cabinet routes, fix teacher courses layout
reword 9b1d4354 feat(cabinet): расписание, курсы учителя/студента, исправления сайдбара
reword 66c39b6b djag+elysia.js
reword 8565bcac fix: исправить редирект после логина и ссылки в navbar
reword 548aef12 docs: обновить README с BridgeCore брендингом и добавить документацию
reword 84e06936 refactoring index.ts w backende
reword 96e076c3 nachali delat stranicy uchiteley i uchenikow
pick 40342bc7 feat: add RFID UID support and refactor cabinet API with Eden Treaty
reword f76d572a feat: добавлен модуль Sales для управления звонками менеджеров
```

Сохранить и закрыть (в vim: `:wq`)

Git будет показывать каждое сообщение для редактирования. Замени на английские версии из таблицы выше.

---

## Способ 2: Git filter-repo (автоматически)

```bash
# Установить git-filter-repo
pip install git-filter-repo

# Создать файл с заменами (message-replacements.txt)
feat(accounting): продвинутая бухгалтерия LanG School|feat(accounting): implement advanced accounting system for LanG School
feat(language-school): кабинет учителя — уроки, список учеников, авто-переключение группы|feat(teacher): add lessons, student list, and auto-group switching
fix: исправить редирект после логина и ссылки в navbar|fix(auth): resolve redirect after login and navbar links
docs: обновить README с BridgeCore брендингом и добавить документацию|docs: update README with BridgeCore branding and documentation
refactoring index.ts w backende|refactor(backend): restructure index.ts entry point
nachali delat stranicy uchiteley i uchenikow|feat(frontend): create teacher and student pages
djag+elysia.js|chore: add Elysia.js debugging configuration
commit perd payments|fix(payments): resolve payment processing issues
feat(cabinet): расписание, курсы учителя/студента, исправления сайдбара|feat(cabinet): add schedule, teacher/student courses, sidebar fixes
feat: добавлен модуль Sales для управления звонками менеджеров|feat(sales): add CRM module for manager call management

# Запустить замену
git filter-repo --message-callback 'return message.replace(old, new)' --force
```

---

## После исправления

```bash
# Проверить новую историю
git log --oneline -20

# Force push на GitHub (⚠️ только если ты единственный автор!)
git push --force-with-lease origin main
```

---

## ⚠️ ВАЖНО

1. **Не делай force push** если репозиторий уже публичный и другие люди работают с ним
2. **Сделай резервную копию** перед началом:
   ```bash
   git branch backup-before-cleanup
   ```
3. **Проверь локально** что всё работает после rebase

---

## Если что-то пошло не так

```bash
# Отменить rebase
git rebase --abort

# Вернуться к резервной копии
git reset --hard backup-before-cleanup
```
