Split complex GitHub issue into manageable sub-tasks: $ARGUMENTS

EXECUTION STEPS:
1. **Parent Issue Analysis**
   ```bash
   gh issue view $ARGUMENTS --json title,body,labels,assignees
   ```

2. **Determine Split Strategy**
   Based on issue content, choose optimal approach:
   - **Technical Stack Split**: Frontend + Backend + Database + Testing
   - **Feature Phase Split**: Core MVP + Enhancements + Polish
   - **Team Boundary Split**: UI Team + API Team + Data Team
   - **User Journey Split**: Step-by-step user interaction flows

3. **Generate Child Issue Plan**
   Create 3-7 child issues with:
   - Clear scope boundaries
   - 1-3 day effort each
   - Independent deliverability
   - Logical dependency order

4. **Create Child Issues**
   ```bash
   # Frontend child issue
   gh issue create \
     --title "[#$ARGUMENTS] Frontend - [Specific Component]" \
     --body "$(generate_child_issue_body frontend)" \
     --label "frontend,child-task,$PARENT_LABELS" \
     --assignee "@me"
   
   # Backend child issue  
   gh issue create \
     --title "[#$ARGUMENTS] Backend - [Specific API/Logic]" \
     --body "$(generate_child_issue_body backend)" \
     --label "backend,child-task,$PARENT_LABELS"
   
   # Continue for all identified components...
   ```

5. **Update Parent Issue**
   ```bash
   # Add epic label
   gh issue edit $ARGUMENTS --add-label "epic"
   
   # Add child issue tracking comment
   gh issue comment $ARGUMENTS --body "
   ## 📋 子タスク一覧
   
   ### 🎯 分割戦略: [Selected strategy]
   
   - [ ] #[CHILD1] - Frontend コンポーネント (推定: 2日)
   - [ ] #[CHILD2] - Backend API実装 (推定: 3日)  
   - [ ] #[CHILD3] - Database スキーマ (推定: 1日)
   - [ ] #[CHILD4] - テスト実装 (推定: 2日)
   
   ### 🔗 依存関係
   [CHILD3] → [CHILD2] → [CHILD1] → [CHILD4]
   
   ### 📅 推奨開発順序
   1. Database schema setup
   2. Backend API implementation
   3. Frontend integration
   4. End-to-end testing
   
   ---
   *✂️ 自動分割実行: $(date -u +"%Y-%m-%d %H:%M UTC")*
   "
   ```

CHILD ISSUE TEMPLATE FUNCTION:
```bash
generate_child_issue_body() {
  local component=$1
  cat << EOF
## 🔗 親Issue
#$ARGUMENTS - [Parent Title]

## 📝 このタスクのスコープ
[Specific responsibilities for this component]

## ✅ 受け入れ基準
- [ ] [Component-specific acceptance criteria]
- [ ] [Integration requirements]
- [ ] [Testing completion criteria]

## 🔧 技術仕様
- **関連ファイル**: [Expected files to modify]
- **推定工数**: 1-3日
- **依存関係**: [Dependency on other child tasks]

## 🧪 Definition of Done
- [ ] Code implementation complete
- [ ] Unit tests written and passing
- [ ] Integration tests passing  
- [ ] Code review completed
- [ ] Documentation updated

---
*🤖 親Issue #$ARGUMENTS から自動生成*
EOF
}
```

COMPLETION CRITERIA:
- 3-7 child issues created successfully
- Parent issue labeled as "epic"
- Child issue tracking comment added
- Proper naming convention applied
- Dependencies documented
