#!/usr/bin/expect -f
set timeout 120
set host "5.183.10.22"
set port "65002"
set user "u845296761"
set pass "Esteban\$3451\$"

puts "===> Uploading caretech-games.zip..."
spawn scp -P $port -o StrictHostKeyChecking=no /Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games.zip $user@$host:domains/caretechservices.com/public_html/
expect {
    "password:" {
        send "$pass\r"
        exp_continue
    }
    "100%" {
        exp_continue
    }
    eof
}

puts "===> Extracting on remote server..."
spawn ssh -p $port -o StrictHostKeyChecking=no $user@$host "cd domains/caretechservices.com/public_html && unzip -o caretech-games.zip && rm -f caretech-games.zip && echo 'DEPLOY_SUCCESS'"
expect {
    "password:" {
        send "$pass\r"
        exp_continue
    }
    "DEPLOY_SUCCESS" {
        puts "\n===> EXTRACT COMPLETED SUCCESSFULLY"
        exp_continue
    }
    eof
}
puts "===> All done!"
