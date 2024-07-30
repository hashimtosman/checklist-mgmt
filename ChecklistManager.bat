@echo off
cd %~dp0
start chrome "http://localhost:5000"
python app.py