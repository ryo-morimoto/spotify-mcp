Assess issue complexity and determine story splitting needs: $ARGUMENTS

EXECUTION STEPS:
1. **Get Issue Details**
   ```bash
   gh issue view $ARGUMENTS --json title,body,labels,comments
   ```

2. **Complexity Metrics Assessment**
   - **Effort Estimation**: Story points/days based on scope
   - **Component Count**: Number of system components affected
   - **Technical Complexity**: Algorithm complexity, new patterns, etc.
   - **Integration Scope**: External system integrations required
   - **Testing Complexity**: Test automation requirements

3. **Complexity Scoring**
   ```bash
   # Calculate complexity score (0-20 scale)
   EFFORT_SCORE=0
   COMPONENT_SCORE=0  
   TECHNICAL_SCORE=0
   INTEGRATION_SCORE=0
   TESTING_SCORE=0
   
   # Sum total complexity
   TOTAL_COMPLEXITY=$((EFFORT_SCORE + COMPONENT_SCORE + TECHNICAL_SCORE + INTEGRATION_SCORE + TESTING_SCORE))
   ```

4. **Apply Complexity Labels**
   ```bash
   if [ $TOTAL_COMPLEXITY -ge 15 ]; then
     gh issue edit $ARGUMENTS --add-label "complex,split-story"
   elif [ $TOTAL_COMPLEXITY -ge 8 ]; then
     gh issue edit $ARGUMENTS --add-label "moderate"
   else
     gh issue edit $ARGUMENTS --add-label "simple"
   fi
   ```

5. **Complexity Assessment Comment**
   ```markdown
   ## 📊 複雑度評価結果

   ### 📈 複雑度スコア: $TOTAL_COMPLEXITY/20
   - **開発工数**: $EFFORT_SCORE/5 (推定: X日)
   - **影響コンポーネント**: $COMPONENT_SCORE/5 (X個のコンポーネント)
   - **技術的複雑度**: $TECHNICAL_SCORE/5
   - **統合要件**: $INTEGRATION_SCORE/5  
   - **テスト複雑度**: $TESTING_SCORE/5

   ### 🎯 推奨アクション
   [Complex: Story splitting recommended / Moderate: Can proceed as-is / Simple: Ready for development]

   ### ⚡ 分割戦略 (複雑な場合)
   1. **コンポーネント分割**: [Frontend/Backend/Database separation]
   2. **フェーズ分割**: [MVP/Enhancement phases]
   3. **チーム分割**: [Team responsibility boundaries]

   ---
   *📊 複雑度評価実行: $(date -u +"%Y-%m-%d %H:%M UTC")*
   ```

COMPLETION CRITERIA:
- Complexity score calculated and documented
- Appropriate complexity label applied
- Split recommendation provided if needed
- Assessment comment posted
