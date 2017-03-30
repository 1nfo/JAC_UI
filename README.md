# JAC_UI

UI for JmeterAwsConf package.

For developer, webpack needs to be install to generate bundle.js.

Front-end: Bootstrap, JQurey, React.js, and socket.io.js  
Back-end: Flask, Flask-socketio, and [JmeterAwsConf](https://github.pydt.lan/szhao/JmeterAwsConf)

## Potential Problem

### Concurrency

JmeterAwsConf is designed as a single task/user API, so there is no consideration to handle multiple users. But the idea of this UI is to support multiple users.


### React vs JQurey
This UI are originally written in JQurey, then tranformed into react.js. Still some JQuery part are there, like socketio, and upload file. 

Some situations is against the idea of how react uses state to manage the page. For example, streamming backend output to page. In react, needs to maintain all the history output, re-render them once new output coming, which is exhausted. Instead, JQurey only appends new output to div. 


### deployment step

check [AWS_TEST](https://github.pydt.lan/szhao/AWS_TEST)