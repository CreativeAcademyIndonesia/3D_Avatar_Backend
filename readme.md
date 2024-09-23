sudo apt update
Install nginx
https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04
sudo apt install mariadb-server
https://www.digitalocean.com/community/tutorials/how-to-install-mariadb-on-ubuntu-22-04
ALTER USER 'root'@'%' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON _._ TO 'root'@'%' IDENTIFIED BY '12345' WITH GRANT OPTION;
FLUSH PRIVILEGES

Install NVM
https://github.com/nvm-sh/nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
nvm --version

install ffmpeg sudo apt install ffmpeg

git clone https://github.com/CreativeAcademyIndonesia/3D_Avatar_Backend.git

isntall rhubrab wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
sudo apt install unzip
mkdir rhubarb
unzip Rhubarb-Lip-Sync-1.13.0-Linux.zip -d rhubarb
chmod +x rhubarb
