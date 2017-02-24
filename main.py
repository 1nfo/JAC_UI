from flask import Flask,render_template

app  = Flask(__name__)

@app.route("/")
def hp():
	title = "Jmeter Cloud Testing"
	paragraph = ['']
	return render_template("index.html",title=title,paragraph=paragraph)

app.config.update(
	DEBUG=True,
	TEMPLATES_AUTO_RELOAD=True
)

if __name__ == "__main__":
    app.run()

