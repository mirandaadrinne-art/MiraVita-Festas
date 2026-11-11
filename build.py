css=open('src/styles.css').read(); core=open('src/core.js').read(); app=open('src/app.js').read()
html=f'''<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bendita Festa</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
<style>{css}</style></head>
<body><div id="app"></div>
<script>{core}</script>
<script>{app}</script>
</body></html>'''
open('index.html','w').write(html); print(len(html))
