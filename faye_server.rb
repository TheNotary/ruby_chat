require 'faye'

bayeux = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)

bayeux.listen(10614)