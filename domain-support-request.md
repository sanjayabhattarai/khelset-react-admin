# DNS Configuration Support Request

**Subject**: Request for Subdomain Creation and DNS Configuration Assistance

---

**To**: [Domain Provider Support Team]  
**From**: [Your Name]  
**Domain**: khelset.com  
**Date**: September 2, 2025

## Request Summary

I need assistance setting up a subdomain for my domain **khelset.com** to point to my Firebase hosting service. I want to create **admin.khelset.com** as a subdomain.

## Technical Requirements

I need to create the following DNS record:

- **Record Type**: CNAME
- **Subdomain/Name**: admin
- **Target/Value**: khelset-new.web.app
- **TTL**: 3600 (or default)

## What I'm Trying to Achieve

I have deployed a React web application on Firebase Hosting (https://khelset-new.web.app) and want to make it accessible through my custom subdomain https://admin.khelset.com.

## Specific Questions

1. **How do I create a subdomain** (admin.khelset.com) in your control panel?

2. **Where do I add the CNAME record** to point the subdomain to Firebase hosting?

3. **What is the expected DNS propagation time** for these changes?

4. **Are there any additional steps** I need to take on your platform to enable subdomain hosting?

## Current Status

- ✅ Main domain: khelset.com (active)
- ✅ Firebase hosting: khelset-new.web.app (deployed and working)
- ❌ Subdomain: admin.khelset.com (needs DNS configuration)

## Expected Outcome

After configuration, I should be able to access my application at:
- https://admin.khelset.com (custom subdomain)
- https://khelset-new.web.app (Firebase URL - should continue working)

## Additional Information

- This is for a cricket scoring administration dashboard
- The application is built with React/TypeScript
- Firebase will automatically handle SSL certificate generation once DNS is verified
- I'm comfortable with technical instructions but need guidance on your specific control panel

## Request for Instructions

Could you please provide:

1. **Step-by-step instructions** for creating the subdomain in your control panel
2. **Screenshots or documentation** showing where to add DNS records
3. **Confirmation** that CNAME records are supported for subdomains
4. **Estimated timeframe** for DNS propagation

## Contact Information

Please reply with detailed instructions or let me know if you need any additional information about my requirements.

Thank you for your assistance!

---

**Note**: This is a one-time setup for a production web application. I appreciate your prompt support in resolving this DNS configuration.
