FROM ubuntu:16.04
 
# Update OS
RUN sed -i 's/# \(.*multiverse$\)/\1/g' /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get -y install sudo 

# Install Python
RUN sudo apt-get install -y python3-pip
RUN sudo apt-get -y install build-essential libssl-dev libffi-dev
RUN sudo apt-get -y redis-server

# Add requirements.txt
ADD . / /webapp/
 
# Set the default directory for our environment
ENV HOME /webapp
WORKDIR /webapp
 
# Install app requirements
RUN pip3 install -r requirements.txt

# Expose port 80
EXPOSE 80

CMD ["redis-server", "--daemonize", "yes"]
CMD ["python3", "main.py", "server"]
