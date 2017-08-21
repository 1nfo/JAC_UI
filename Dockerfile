FROM ubuntu:16.04

# Update OS
RUN sed -i 's/# \(.*multiverse$\)/\1/g' /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get -y install sudo

# Install Python and other dependencies
RUN sudo apt-get install -y python3-pip
RUN sudo apt-get install -y build-essential checkinstall libssl-dev libffi-dev
RUN sudo apt-get install -y redis-server
RUN apt-get update && sudo apt-get install -y curl

# install node.js
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN apt-get update
RUN sudo apt-get install -y nodejs


# Add requirements.txt
ADD . / /webapp/
# don't forget ssh key# don't forget ssh key# don't forget ssh key
ADD ./JAC_key_pair.pem /webapp

# Set the default directory for our environment
ENV HOME /webapp
WORKDIR /webapp

# install node dependency
RUN npm install
RUN npm install -g webpack

RUN chmod +x start.sh
RUN mv start.sh /usr/bin/start

# Install app requirements
RUN pip3 install -r requirements.txt

# Expose port 80
EXPOSE 80

CMD ["redis-server", "--daemonize", "yes"]
CMD ["python3", "main.py", "server"]
