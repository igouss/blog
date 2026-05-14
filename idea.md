--
title: Self hosted blog.
date: 2020-02-12


# Blog my ideas using md files, hosted on my tailnet, exposing it to the internet using tailscale funnel

I want to create a blog here, I'll write post in markdown and caddy server will render markdown with http hemplate handler when access from a web browser
and markdown when client accept text/markdown. We will use tailscape funnel to serve the blog to internet. You wil add a blog CNAME alias for this
deployment. Blog should be available on both http and https, I think tailscale takes care of certificate. caddy support terminating tls via tailscale
certificate fetching. Blog articles will be stored in this directory, templates and css too, as all the scripts and configurations (all in separate
directories). I want to create a terraform to configure tailscale configuration such as adding CNAME to blog.mist-walleye.ts.net this should route to this
machine fedora.mist-walleye.ts.net. You should also generate a template that will be used to render markdown as html.
