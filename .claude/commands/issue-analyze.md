Analyze GitHub issue for technical completeness and requirements: $ARGUMENTS

EXECUTION STEPS:
1. **Get Issue Details**
   ```bash
   gh issue view $ARGUMENTS --json title,body,labels,assignees,comments
   ```

2. **Content Analysis**
   - Feature description completeness assessment
   - Technical requirement gaps identification
   - User story clarity evaluation
   - Business value articulation check

3. **Generate Missing Requirements**
   - API design considerations
   - Database schema requirements
   - UI/UX specifications
   - Performance requirements
   - Security considerations
   - Integration points

4. **Create Acceptance Criteria**
   - Functional requirements → testable criteria
   - Edge cases identification
   - Error handling scenarios
   - User experience validation points

5. **Implementation Suggestions**
   - Technical approach recommendations
   - Architecture pattern suggestions
   - Technology stack considerations
   - Development phases breakdown

6. **Post Analysis Comment**
   ```markdown
   ## 🔍 技術要件分析

   ### 📋 不足要件の特定
   [Specific missing requirements and questions]

   ### ✅ 推奨受け入れ基準
   - [ ] [Actionable, testable criteria]
   - [ ] [User experience validation]
   - [ ] [Error handling verification]

   ### 🔧 実装アプローチ提案
   1. **推奨アーキテクチャ**: [Pattern recommendation]
   2. **技術選択**: [Technology suggestions with rationale]
   3. **開発フェーズ**: [Phase breakdown]

   ### ⚠️ 技術リスク
   - **リスク1**: [Risk description] → [Mitigation strategy]
   - **依存関係**: [Dependencies and blockers]

   ### 📊 次のステップ
   [Recommended immediate actions]

   ---
   *🤖 自動分析実行時刻: $(date -u +"%Y-%m-%d %H:%M UTC")*
   ```

COMPLETION CRITERIA:
- Analysis comment posted successfully
- No labels modified (labeling is separate responsibility)
- Analysis focuses purely on technical content
