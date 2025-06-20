Apply automated labels to GitHub issue based on content analysis: $ARGUMENTS

EXECUTION STEPS:
1. **Get Issue Content**
   ```bash
   gh issue view $ARGUMENTS --json title,body,labels
   ```

2. **Component Classification**
   ```bash
   # Frontend indicators
   if [mentions: UI, component, styling, React, Vue, Angular]: 
     gh issue edit $ARGUMENTS --add-label "frontend"
   
   # Backend indicators  
   if [mentions: API, server, database, logic, Node.js, Python]:
     gh issue edit $ARGUMENTS --add-label "backend"
   
   # Database indicators
   if [mentions: schema, migration, SQL, MongoDB, data model]:
     gh issue edit $ARGUMENTS --add-label "database"
   
   # API indicators
   if [mentions: endpoint, REST, GraphQL, API design]:
     gh issue edit $ARGUMENTS --add-label "api"
   ```

3. **Type Classification**
   ```bash
   # Feature vs Enhancement vs Bug
   if [new functionality]: gh issue edit $ARGUMENTS --add-label "feature"
   if [improvement to existing]: gh issue edit $ARGUMENTS --add-label "enhancement"  
   if [error/fix needed]: gh issue edit $ARGUMENTS --add-label "bug"
   if [documentation]: gh issue edit $ARGUMENTS --add-label "documentation"
   ```

4. **Priority Assessment**
   ```bash
   # Based on business impact and urgency keywords
   if [critical/urgent/blocking]: gh issue edit $ARGUMENTS --add-label "P0"
   if [important/high-impact]: gh issue edit $ARGUMENTS --add-label "P1"
   if [moderate/standard]: gh issue edit $ARGUMENTS --add-label "P2"  
   if [nice-to-have/low]: gh issue edit $ARGUMENTS --add-label "P3"
   ```

5. **Status Labels**
   ```bash
   gh issue edit $ARGUMENTS --add-label "needs-analysis"
   ```

COMPLETION CRITERIA:
- Minimum 2-4 labels applied
- Component labels based on technical content
- Type and priority labels assigned
- No analysis comments generated (analysis is separate responsibility)
